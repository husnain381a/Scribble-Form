// Uses two existing confirmed TEST accounts. No accounts or emails are created.
// Creates a clearly labelled test form, tests it, then deletes that form and file.
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { blankForm, makeField } from '../src/lib/forms';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const origin = process.env.APP_ORIGIN;
for (const name of [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'APP_ORIGIN',
  'TEST_USER_A_EMAIL',
  'TEST_USER_A_PASSWORD',
  'TEST_USER_B_EMAIL',
  'TEST_USER_B_PASSWORD',
])
  if (!process.env[name]) throw new Error(`Missing ${name}. See docs/DEPLOYMENT.md.`);
const a = createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } }),
  b = createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } }),
  anon = createClient(url!, key!, { auth: { persistSession: false } });
const authA = await a.auth.signInWithPassword({
  email: process.env.TEST_USER_A_EMAIL!,
  password: process.env.TEST_USER_A_PASSWORD!,
});
const authB = await b.auth.signInWithPassword({
  email: process.env.TEST_USER_B_EMAIL!,
  password: process.env.TEST_USER_B_PASSWORD!,
});
if (authA.error || authB.error) throw new Error('Both test accounts must exist and be confirmed.');
const tokenA = authA.data.session!.access_token,
  tokenB = authB.data.session!.access_token;
async function call(path: string, method = 'GET', body?: unknown, token?: string) {
  return fetch(`${origin}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Origin: origin!,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
let formId = '';
try {
  const fileField = makeField('file', 'TEST: attach a text file');
  const def = {
    ...blankForm(),
    title: '[Scribble automated verification — disposable]',
    fields: [...blankForm().fields, fileField],
  };
  const { data: form, error } = await a
    .from('scribble_forms')
    .insert({ owner_id: authA.data.user!.id, draft: def })
    .select()
    .single();
  if (error) throw new Error('Could not create test form. Apply the migration first.');
  formId = form.id;
  const crossOwnerUpdate = await b
    .from('scribble_forms')
    .update({ draft: { ...def, title: 'must not change' } })
    .eq('id', formId)
    .select('id');
  assert.equal(crossOwnerUpdate.data?.length, 0, 'cross-owner update denied');
  const transfer = await a
    .from('scribble_forms')
    .update({ owner_id: authB.data.user!.id })
    .eq('id', formId);
  assert.ok(transfer.error, 'ownership column cannot be reassigned');
  assert.equal(
    (await b.from('scribble_forms').select('*').eq('id', formId)).data?.length,
    0,
    'cross-owner drafts',
  );
  for (const table of [
    'scribble_forms',
    'scribble_versions',
    'scribble_submissions',
    'scribble_uploads',
    'scribble_rate_limits',
  ]) {
    const result = await anon.from(table).select('*');
    assert.ok(result.error || result.data?.length === 0, `anonymous ${table}`);
  }
  assert.ok(
    (await a.rpc('scribble_consume_limit', { p_key: '0'.repeat(64), p_limit: 1, p_seconds: 600 }))
      .error,
    'clients cannot execute server rate-limit RPC',
  );
  assert.ok(
    (
      await anon.rpc('scribble_finalize_submission', {
        p_form_id: formId,
        p_version_id: crypto.randomUUID(),
        p_id: crypto.randomUUID(),
        p_answers: {},
      })
    ).error,
    'anonymous callers cannot execute privileged submission RPC',
  );
  const blockedOrigin = await fetch(`${origin}/api/forms/${formId}/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://untrusted.invalid',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ definition: def }),
  });
  assert.equal(blockedOrigin.status, 403, 'foreign-origin mutation rejected');
  assert.equal(
    (await call(`/api/forms/${formId}/publish`, 'POST', { definition: def }, tokenB)).status,
    404,
    'cross-owner publishing',
  );
  const pub = await call(`/api/forms/${formId}/publish`, 'POST', { definition: def }, tokenA);
  assert.equal(pub.status, 200, 'publishing');
  const published = await pub.json();
  const version = published.published_version_id;
  const publicForm = await call(`/api/public/${formId}`);
  assert.equal(publicForm.status, 200);
  const safe = await publicForm.json();
  assert.equal(safe.owner_id, undefined);
  assert.equal(safe.draft, undefined);
  const attempt = crypto.randomUUID(),
    blob = new Blob(['Scribble disposable upload verification.'], { type: 'text/plain' });
  const ticketResponse = await call(`/api/public/${formId}/upload`, 'POST', {
    field_id: fileField.id,
    version_id: version,
    submission_id: attempt,
    name: 'test.txt',
    size: blob.size,
    type: blob.type,
  });
  assert.equal(ticketResponse.status, 200, 'upload ticket');
  const ticket = await ticketResponse.json();
  const uploaded = await anon.storage
    .from('scribble-uploads')
    .uploadToSignedUrl(ticket.path, ticket.upload_token, blob, {
      contentType: 'text/plain',
      upsert: false,
    });
  assert.equal(uploaded.error, null, 'signed upload');
  assert.ok(
    (await anon.storage.from('scribble-uploads').download(ticket.path)).error,
    'direct anonymous storage read denied',
  );
  assert.ok(
    (await b.storage.from('scribble-uploads').download(ticket.path)).error,
    'direct cross-owner storage read denied',
  );
  const answers = {
    [def.fields[0].id]: 'Test Student',
    [def.fields[1].id]: 'test@example.org',
    [fileField.id]: { token: ticket.token, name: 'test.txt', size: blob.size, type: 'text/plain' },
  };
  const body = { version_id: version, submission_id: attempt, answers };
  assert.equal(
    (await call(`/api/files/${ticket.token}`)).status,
    401,
    'file endpoint requires authentication',
  );
  assert.equal(
    (
      await call(`/api/public/${formId}/submit`, 'POST', {
        ...body,
        submission_id: crypto.randomUUID(),
      })
    ).status,
    400,
    'foreign upload ticket',
  );
  assert.equal(
    (await call(`/api/public/${formId}/submit`, 'POST', { ...body, answers: {} })).status,
    422,
    'required fields',
  );
  const submitted = await call(`/api/public/${formId}/submit`, 'POST', body);
  assert.equal(
    submitted.status,
    201,
    `valid submission: ${JSON.stringify(await submitted.json())}`,
  );
  assert.equal(
    (await call(`/api/public/${formId}/submit`, 'POST', body)).status,
    200,
    'idempotent retry',
  );
  const responses = await a.from('scribble_submissions').select('*').eq('form_id', formId);
  assert.equal(responses.data?.length, 1);
  const workspaceRows = await a
    .from('scribble_forms')
    .select('*, scribble_submissions(count)')
    .eq('id', formId);
  assert.equal(workspaceRows.error, null, 'workspace relationship');
  assert.equal(workspaceRows.data?.[0]?.scribble_submissions?.[0]?.count, 1);
  const responseRows = await a
    .from('scribble_submissions')
    .select('*, scribble_versions(definition)')
    .eq('form_id', formId);
  assert.equal(responseRows.error, null, 'response version relationship');
  assert.equal(responseRows.data?.[0]?.scribble_versions?.definition?.title, def.title);
  assert.equal(
    (await b.from('scribble_submissions').select('*').eq('form_id', formId)).data?.length,
    0,
    'cross-owner responses',
  );
  assert.equal(
    (
      await anon
        .from('scribble_submissions')
        .insert({ id: crypto.randomUUID(), form_id: formId, version_id: version, answers: {} })
    ).error !== null,
    true,
    'direct insert',
  );
  assert.equal(
    (await call(`/api/files/${ticket.token}`, 'GET', undefined, tokenB)).status,
    404,
    'cross-owner file download',
  );
  const ownDownload = await call(`/api/files/${ticket.token}`, 'GET', undefined, tokenA);
  assert.equal(ownDownload.status, 200, 'owner download');
  const download = await fetch((await ownDownload.json()).url);
  assert.equal(download.status, 200, 'signed file read');
  assert.equal(await download.text(), await blob.text(), 'downloaded bytes');
  const immutable = await a
    .from('scribble_versions')
    .update({ definition: { ...def, title: 'Tampered' } })
    .eq('id', version);
  assert.ok(immutable.error, 'immutable published version');
  const altered = { ...def, title: 'Second version' };
  assert.equal(
    (await call(`/api/forms/${formId}/publish`, 'POST', { definition: altered }, tokenA)).status,
    200,
  );
  assert.equal(
    (
      await call(`/api/public/${formId}/submit`, 'POST', {
        ...body,
        submission_id: crypto.randomUUID(),
      })
    ).status,
    409,
    'stale version',
  );
  await a.from('scribble_forms').update({ status: 'closed' }).eq('id', formId);
  const closedView = await (await call(`/api/public/${formId}`)).json();
  assert.equal(closedView.status, 'closed');
  assert.equal(closedView.definition, undefined, 'closed form does not expose its question schema');
  assert.equal(
    (
      await call(`/api/public/${formId}/submit`, 'POST', {
        ...body,
        submission_id: crypto.randomUUID(),
      })
    ).status,
    409,
    'closed form',
  );
  const removed = await a.from('scribble_submissions').delete().eq('id', attempt);
  assert.equal(removed.error, null, 'owner can remove a response');
  assert.equal(
    (await call(`/api/files/${ticket.token}`, 'GET', undefined, tokenA)).status,
    404,
    'deleted responses cannot receive new signed file URLs',
  );
  console.log(
    'PASS: cloud publish, validation, signed uploads, private downloads, RLS, snapshots, idempotency, stale and closed forms.',
  );
} finally {
  if (formId) {
    const result = await call(`/api/forms/${formId}`, 'DELETE', undefined, tokenA);
    assert.equal(result.status, 200, 'test form cleanup');
  }
  await Promise.all([a.auth.signOut(), b.auth.signOut()]);
}
