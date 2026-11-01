import test from 'node:test';
import assert from 'node:assert/strict';
import { localRepo } from '../src/lib/local';
import { blankForm } from '../src/lib/forms';
test('sandbox persists edits, pins published questions, rejects closed/stale forms, and deduplicates retries', async () => {
  const data = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (k: string) => data.get(k) || null,
      setItem: (k: string, v: string) => data.set(k, v),
      removeItem: (k: string) => data.delete(k),
    },
    configurable: true,
  });
  const form = await localRepo.create(blankForm());
  const published = await localRepo.publish(form);
  const first = await localRepo.public(form.id);
  assert.ok(first);
  const responseId = crypto.randomUUID();
  const answers = {
    [form.draft.fields[0].id]: 'Sandbox Student',
    [form.draft.fields[1].id]: 'test@example.org',
  };
  await localRepo.submit(first, answers, responseId);
  await localRepo.submit(first, answers, responseId);
  assert.equal((await localRepo.responses(form.id)).length, 1);
  const updated = { ...published, draft: { ...published.draft, title: 'Changed draft title' } };
  await localRepo.save(updated);
  assert.equal((await localRepo.get(form.id))?.draft.title, 'Changed draft title');
  assert.notEqual((await localRepo.public(form.id))?.definition.title, 'Changed draft title');
  const version2 = await localRepo.publish(updated);
  await assert.rejects(localRepo.submit(first, answers, crypto.randomUUID()), /changed or closed/);
  const responses = await localRepo.responses(form.id);
  assert.equal(responses[0].definition?.title, form.draft.title);
  await localRepo.save({ ...version2, status: 'closed' });
  assert.equal((await localRepo.public(form.id))?.status, 'closed');
  await assert.rejects(
    localRepo.submit((await localRepo.public(form.id))!, answers, crypto.randomUUID()),
  );
  await localRepo.removeResponse(responseId);
  assert.equal((await localRepo.responses(form.id)).length, 0);
  await localRepo.remove(form.id);
  assert.equal((await localRepo.list()).length, 0);
});
