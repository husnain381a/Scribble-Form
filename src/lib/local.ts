import type {
  FormRecord,
  FormDefinition,
  Submission,
  PublishedForm,
  Answers,
  FileAnswer,
} from './types';
import { uid } from './forms';
const KEY = 'scribble-workspace-v1';
type LocalData = {
  forms: FormRecord[];
  versions: Record<string, FormDefinition>;
  responses: Submission[];
};
export function readLocal(): LocalData {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{"forms":[],"versions":{},"responses":[]}');
  } catch {
    throw new Error(
      'Your local workspace could not be read. Export or back up browser data before clearing it.',
    );
  }
}
function writeLocal(data: LocalData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    throw new Error('Browser storage is full or unavailable. Your changes have not been saved.');
  }
}
export const localRepo = {
  async list() {
    const d = readLocal();
    return d.forms.map((f) => ({
      ...f,
      response_count: d.responses.filter((r) => r.form_id === f.id).length,
    }));
  },
  async get(id: string) {
    return readLocal().forms.find((f) => f.id === id) || null;
  },
  async create(definition: FormDefinition) {
    const d = readLocal();
    const now = new Date().toISOString();
    const f: FormRecord = {
      id: uid(),
      draft: definition,
      status: 'draft',
      published_version_id: null,
      created_at: now,
      updated_at: now,
    };
    d.forms.unshift(f);
    writeLocal(d);
    return f;
  },
  async save(form: FormRecord) {
    const d = readLocal();
    const i = d.forms.findIndex((f) => f.id === form.id);
    if (i < 0) throw new Error('Form no longer exists.');
    d.forms[i] = { ...form, updated_at: new Date().toISOString() };
    writeLocal(d);
  },
  async publish(form: FormRecord) {
    const d = readLocal();
    const version = uid();
    d.versions[version] = structuredClone(form.draft);
    const published = {
      ...form,
      status: 'published' as const,
      published_version_id: version,
      updated_at: new Date().toISOString(),
    };
    d.forms = d.forms.map((f) => (f.id === form.id ? published : f));
    writeLocal(d);
    return published;
  },
  async remove(id: string) {
    const d = readLocal();
    const ids = d.responses
      .filter((r) => r.form_id === id)
      .flatMap((r) =>
        Object.values(r.answers)
          .filter((a): a is FileAnswer => typeof a === 'object' && a !== null && 'token' in a)
          .map((a) => a.token),
      );
    for (const token of ids) await deleteLocalFile(token);
    const f = d.forms.find((f) => f.id === id);
    if (f?.published_version_id) delete d.versions[f.published_version_id];
    d.forms = d.forms.filter((f) => f.id !== id);
    d.responses = d.responses.filter((r) => r.form_id !== id);
    writeLocal(d);
  },
  async responses(id: string) {
    const d = readLocal();
    return d.responses
      .filter((r) => r.form_id === id)
      .map((r) => ({ ...r, definition: d.versions[r.version_id] }));
  },
  async removeResponse(id: string) {
    const d = readLocal();
    const r = d.responses.find((r) => r.id === id);
    if (r)
      for (const a of Object.values(r.answers))
        if (typeof a === 'object' && a !== null && 'token' in a) await deleteLocalFile(a.token);
    d.responses = d.responses.filter((r) => r.id !== id);
    writeLocal(d);
  },
  async public(id: string): Promise<PublishedForm | null> {
    const f = readLocal().forms.find((f) => f.id === id);
    if (!f || !f.published_version_id || f.status === 'draft') return null;
    return {
      id: f.id,
      version_id: f.published_version_id,
      definition: readLocal().versions[f.published_version_id],
      status: f.status,
    };
  },
  async submit(form: PublishedForm, answers: Answers, id: string) {
    const d = readLocal();
    const actual = d.forms.find((f) => f.id === form.id);
    if (actual?.status !== 'published' || actual.published_version_id !== form.version_id)
      throw new Error('This form has changed or closed. Refresh before trying again.');
    if (!d.responses.some((r) => r.id === id)) {
      d.responses.unshift({
        id,
        form_id: form.id,
        version_id: form.version_id,
        answers,
        created_at: new Date().toISOString(),
      });
      writeLocal(d);
    }
  },
};
async function fileDb() {
  return await new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open('scribble-files', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('files');
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(new Error('File storage is unavailable in this browser.'));
  });
}
export async function saveLocalFile(file: File): Promise<FileAnswer> {
  const token = uid();
  const db = await fileDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    tx.objectStore('files').put(file, token);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error('Could not save this file.'));
  });
  db.close();
  return { token, name: file.name, size: file.size, type: file.type };
}
export async function getLocalFile(token: string): Promise<Blob> {
  const db = await fileDb();
  try {
    return await new Promise((resolve, reject) => {
      const r = db.transaction('files').objectStore('files').get(token);
      r.onsuccess = () =>
        r.result ? resolve(r.result) : reject(new Error('This local file is no longer available.'));
      r.onerror = () => reject(new Error('Could not load file.'));
    });
  } finally {
    db.close();
  }
}
async function deleteLocalFile(token: string) {
  const db = await fileDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    tx.objectStore('files').delete(token);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error('Could not remove file.'));
  });
  db.close();
}
