import { supabase } from './supabase';
import { localRepo, getLocalFile } from './local';
import type { FormRecord, FormDefinition, Submission, FileAnswer } from './types';
export async function api(path: string, init: RequestInit = {}) {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  const headers = new Headers(init.headers);
  if (session) headers.set('Authorization', `Bearer ${session.access_token}`);
  if (init.body && typeof init.body === 'string') headers.set('Content-Type', 'application/json');
  const r = await fetch(path, { ...init, headers });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}
export function repository(cloud: boolean) {
  if (!cloud || !supabase) return localRepo;
  const db = supabase;
  return {
    async list(): Promise<FormRecord[]> {
      const records: FormRecord[] = [];
      for (let start = 0; ; start += 500) {
        const { data, error } = await db
          .from('scribble_forms')
          .select('*, scribble_submissions(count)')
          .order('updated_at', { ascending: false })
          .order('id')
          .range(start, start + 499);
        if (error) throw new Error(error.message);
        records.push(
          ...(data || []).map((f) => ({
            ...f,
            response_count: f.scribble_submissions?.[0]?.count || 0,
          })),
        );
        if (!data || data.length < 500) return records;
      }
    },
    async get(id: string): Promise<FormRecord | null> {
      const { data, error } = await db
        .from('scribble_forms')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
    async create(definition: FormDefinition): Promise<FormRecord> {
      const {
        data: { user },
      } = await db.auth.getUser();
      if (!user) throw new Error('Please sign in to save to the cloud.');
      const { data, error } = await db
        .from('scribble_forms')
        .insert({ owner_id: user.id, draft: definition })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    async save(form: FormRecord) {
      const { data, error } = await db
        .from('scribble_forms')
        .update({
          draft: form.draft,
          status: form.status === 'published' ? 'published' : form.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', form.id)
        .select('id')
        .single();
      if (error || !data) throw new Error(error?.message || 'Form could not be saved.');
    },
    async publish(form: FormRecord): Promise<FormRecord> {
      return api(`/api/forms/${form.id}/publish`, {
        method: 'POST',
        body: JSON.stringify({ definition: form.draft }),
      });
    },
    async remove(id: string) {
      await api(`/api/forms/${id}`, { method: 'DELETE' });
    },
    async responses(id: string): Promise<Submission[]> {
      const records: Submission[] = [];
      for (let start = 0; ; start += 500) {
        const { data, error } = await db
          .from('scribble_submissions')
          .select('*, scribble_versions(definition)')
          .eq('form_id', id)
          .order('created_at', { ascending: false })
          .order('id')
          .range(start, start + 499);
        if (error) throw new Error(error.message);
        records.push(
          ...(data || []).map((r) => ({ ...r, definition: r.scribble_versions?.definition })),
        );
        if (!data || data.length < 500) return records;
      }
    },
    async removeResponse(id: string) {
      await api(`/api/responses/${id}`, { method: 'DELETE' });
    },
    public: localRepo.public,
    submit: localRepo.submit,
  };
}
export async function downloadFile(file: FileAnswer, cloud: boolean) {
  let url: string;
  if (cloud) {
    url = (await api(`/api/files/${file.token}`)).url;
  } else {
    url = URL.createObjectURL(await getLocalFile(file.token));
  }
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.rel = 'noopener';
  a.click();
  if (!cloud) setTimeout(() => URL.revokeObjectURL(url), 1000);
}
