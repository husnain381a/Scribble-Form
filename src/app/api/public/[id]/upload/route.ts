import { randomUUID } from 'node:crypto';
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
import { safeFileName } from '@/lib/forms';
const schema = z
  .object({
    field_id: z.uuid(),
    version_id: z.uuid(),
    submission_id: z.uuid(),
    name: z.string().min(1).max(240).refine(safeFileName, 'Choose a file with a valid filename.'),
    type: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain']),
    size: z
      .number()
      .int()
      .positive()
      .max(5 * 1024 * 1024),
  })
  .strict();
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    checkOrigin(request);
    const { id } = await params;
    await limit(request, 'uploads', 20);
    const input = schema.parse(await readJson(request, 4096));
    const form = await published(id);
    if (form.version_id !== input.version_id)
      throw new ApiError('This form has changed. Refresh the page before uploading.', 409);
    if (!form.definition.fields.some((f) => f.id === input.field_id && f.type === 'file'))
      throw new ApiError('This form does not accept this file.');
    const db = admin();
    const { count, error: countError } = await db
      .from('scribble_uploads')
      .select('token', { count: 'exact', head: true })
      .eq('submission_id', input.submission_id)
      .eq('form_id', id);
    if (countError) throw new ApiError('File storage is temporarily unavailable.', 503);
    if ((count || 0) >= 15)
      throw new ApiError('There are too many files in this response. Refresh to start again.', 429);
    const token = randomUUID();
    const ext: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'application/pdf': 'pdf',
      'text/plain': 'txt',
    };
    const path = `${id}/${input.submission_id}/${token}.${ext[input.type]}`;
    const { error } = await db.from('scribble_uploads').insert({
      token,
      form_id: id,
      version_id: input.version_id,
      submission_id: input.submission_id,
      field_id: input.field_id,
      path,
      name: input.name,
      size: input.size,
      mime: input.type,
    });
    if (error) throw new ApiError('Could not prepare your upload.', 503);
    const { data, error: signError } = await db.storage
      .from('scribble-uploads')
      .createSignedUploadUrl(path, { upsert: false });
    if (signError || !data) {
      await db.from('scribble_uploads').delete().eq('token', token);
      throw new ApiError('Could not prepare your upload. Please try again.', 503);
    }
    return json({ token, path, upload_token: data.token });
  });
}
