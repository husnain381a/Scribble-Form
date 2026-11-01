import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { FormDefinition, PublishedForm } from './types';
import { definitionSchema } from './forms';
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL;
export function admin() {
  if (!url() || !process.env.SUPABASE_SECRET_KEY)
    throw new ApiError(
      'Cloud publishing is not configured yet. The host needs to add the Supabase environment values.',
      503,
    );
  return createClient(url()!, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export async function owner(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '');
  if (!token || !url() || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
    throw new ApiError('Sign in to continue.', 401);
  const db = createClient(url()!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user)
    throw new ApiError('Your session has expired. Please sign in again.', 401);
  return { db, user: data.user };
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const expected = process.env.APP_ORIGIN;
  if (process.env.NODE_ENV === 'production' && !expected)
    throw new ApiError('The host needs to configure APP_ORIGIN before accepting responses.', 503);
  if (!origin) return;
  const local =
    process.env.NODE_ENV !== 'production' &&
    ['http://localhost:3000', 'http://127.0.0.1:3000'].includes(origin);
  if (!local && origin !== (expected || new URL(request.url).origin))
    throw new ApiError('This request came from an unsupported origin.', 403);
}
export async function readJson(request: Request, max = 200000): Promise<unknown> {
  if (!request.headers.get('content-type')?.includes('application/json'))
    throw new ApiError('Send a JSON request.', 415);
  if (Number(request.headers.get('content-length') || 0) > max)
    throw new ApiError('This request is too large.', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError('Request body is missing.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel();
      throw new ApiError('This request is too large.', 413);
    }
    chunks.push(value);
  }
  try {
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const c of chunks) {
      bytes.set(c, offset);
      offset += c.length;
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new ApiError('This request contains invalid JSON.');
  }
}
export function validId(id: string) {
  if (!z.uuid().safeParse(id).success) throw new ApiError('This form could not be found.', 404);
  return id;
}
export async function limit(request: Request, scope: string, max: number) {
  const secret = process.env.RATE_LIMIT_SECRET;
  if (!secret || secret.length < 32)
    throw new ApiError(
      'The host needs to configure the rate-limit secret before accepting public traffic.',
      503,
    );
  const ip = process.env.VERCEL
    ? request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    : 'local-development';
  const key = createHmac('sha256', secret).update(`${scope}:${ip}`).digest('hex');
  const { data, error } = await admin().rpc('scribble_consume_limit', {
    p_key: key,
    p_limit: max,
    p_seconds: 600,
  });
  if (error)
    throw new ApiError('The form is temporarily unavailable. Please try again shortly.', 503);
  if (!data) throw new ApiError('A few too many requests. Please try again in ten minutes.', 429);
}
export async function published(id: string, allowClosed = false): Promise<PublishedForm> {
  validId(id);
  const db = admin();
  const { data: form, error } = await db
    .from('scribble_forms')
    .select('id,status,published_version_id')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new ApiError('Could not load this form. Please try again.', 503);
  if (!form || !form.published_version_id || form.status === 'draft')
    throw new ApiError('This form is not available.', 404);
  if (form.status === 'closed' && !allowClosed)
    throw new ApiError('This form has closed. It is no longer accepting responses.', 409);
  const { data: version, error: ve } = await db
    .from('scribble_versions')
    .select('id,definition')
    .eq('id', form.published_version_id)
    .eq('form_id', id)
    .single();
  if (ve || !version) throw new ApiError('This form is temporarily unavailable.', 503);
  const safeDefinition = definitionSchema.safeParse(version.definition);
  if (!safeDefinition.success) throw new ApiError('This form is temporarily unavailable.', 503);
  return {
    id,
    version_id: version.id,
    definition: safeDefinition.data,
    status: form.status,
  };
}
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      ...(status === 429 ? { 'Retry-After': '600' } : {}),
    },
  });
}
export async function route(fn: () => Promise<NextResponse>) {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ApiError) return json({ error: e.message }, e.status);
    if (e instanceof z.ZodError)
      return json({ error: e.issues[0]?.message || 'Check the values in your request.' }, 400);
    console.error('Scribble API request failed.');
    return json({ error: 'Something went wrong. Please try again shortly.' }, 503);
  }
}
export async function assertOwnForm(request: Request, id: string) {
  validId(id);
  const { db, user } = await owner(request);
  const { data: form, error } = await db
    .from('scribble_forms')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .maybeSingle();
  if (error) throw new ApiError('Could not open this form.', 503);
  if (!form) throw new ApiError('This form is not in your workspace.', 404);
  return { db, user, form };
}
export async function removeFiles(formId: string, responseId?: string) {
  const db = admin();
  while (true) {
    let q = db.from('scribble_uploads').select('path,token').eq('form_id', formId).limit(100);
    if (responseId) q = q.eq('submission_id', responseId);
    const { data, error } = await q;
    if (error) throw new ApiError('Could not locate attached files. Nothing was deleted.', 503);
    if (!data?.length) return;
    const { error: storageError } = await db.storage
      .from('scribble-uploads')
      .remove(data.map((f) => f.path));
    if (storageError)
      throw new ApiError('Some files could not be removed. Please retry deletion.', 503);
    const { error: de } = await db
      .from('scribble_uploads')
      .delete()
      .in(
        'token',
        data.map((f) => f.token),
      );
    if (de) throw new ApiError('Could not finish file cleanup. Please retry.', 503);
  }
}
