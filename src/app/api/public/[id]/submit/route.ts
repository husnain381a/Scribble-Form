import { z } from 'zod';
import {
  admin,
  ApiError,
  published,
  json,
  route,
  limit,
  readJson,
  checkOrigin,
} from '@/lib/server';
import { validateAnswers } from '@/lib/forms';
import type { FileAnswer } from '@/lib/types';
const schema = z
  .object({
    version_id: z.uuid(),
    submission_id: z.uuid(),
    answers: z.record(z.string(), z.unknown()),
    website: z.string().max(200).optional(),
  })
  .strict();
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    checkOrigin(request);
    const { id } = await params;
    await limit(request, 'submit', 30);
    const input = schema.parse(await readJson(request));
    if (input.website) throw new ApiError('This response could not be accepted.');
    const form = await published(id);
    const db = admin();
    const { data: existing } = await db
      .from('scribble_submissions')
      .select('id,form_id,version_id')
      .eq('id', input.submission_id)
      .maybeSingle();
    if (existing) {
      if (existing.form_id !== id || existing.version_id !== input.version_id)
        throw new ApiError('This response identifier has already been used.', 409);
      return json({ ok: true });
    }
    if (form.version_id !== input.version_id)
      throw new ApiError('The form has changed. Refresh the page before submitting.', 409);
    const result = validateAnswers(form.definition, input.answers);
    if (Object.keys(result.errors).length)
      return json({ error: 'Please check your answers.', fields: result.errors }, 422);
    for (const [fieldId, value] of Object.entries(result.answers)) {
      if (typeof value !== 'object' || value === null || !('token' in value)) continue;
      const file = value as FileAnswer;
      const { data: upload, error } = await db
        .from('scribble_uploads')
        .select('*')
        .eq('token', file.token)
        .eq('form_id', id)
        .eq('version_id', input.version_id)
        .eq('submission_id', input.submission_id)
        .eq('field_id', fieldId)
        .is('used_at', null)
        .maybeSingle();
      if (
        error ||
        !upload ||
        upload.name !== file.name ||
        upload.size !== file.size ||
        upload.mime !== file.type ||
        Date.now() - Date.parse(upload.created_at) > 2 * 3600000
      )
        throw new ApiError('An attached file is invalid or expired. Please upload it again.');
      const { data: info, error: infoError } = await db.storage
        .from('scribble-uploads')
        .info(upload.path);
      if (
        infoError ||
        !info ||
        Number(info.size) !== file.size ||
        info.contentType?.split(';')[0].trim().toLowerCase() !== file.type
      )
        throw new ApiError('An attached file has not finished uploading. Please attach it again.');
    }
    const { error } = await db.rpc('scribble_finalize_submission', {
      p_form_id: id,
      p_version_id: input.version_id,
      p_id: input.submission_id,
      p_answers: result.answers,
    });
    if (error) {
      if (error.message.includes('FORM_CHANGED'))
        throw new ApiError('The form has changed or closed. Refresh before trying again.', 409);
      throw new ApiError('Your response could not be saved. Please try again.', 503);
    }
    return json({ ok: true }, 201);
  });
}
