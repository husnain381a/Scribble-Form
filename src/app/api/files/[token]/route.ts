import { owner, admin, ApiError, json, route, validId } from '@/lib/server';
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  return route(async () => {
    const { token } = await params;
    validId(token);
    const { db } = await owner(request);
    const service = admin();
    const { data: file, error } = await service
      .from('scribble_uploads')
      .select('path,form_id,submission_id,name,used_at')
      .eq('token', token)
      .maybeSingle();
    if (error || !file || !file.used_at) throw new ApiError('This file could not be found.', 404);
    const { data: form } = await db
      .from('scribble_forms')
      .select('id')
      .eq('id', file.form_id)
      .maybeSingle();
    if (!form) throw new ApiError('This file could not be found.', 404);
    const { data: submission } = await db
      .from('scribble_submissions')
      .select('id')
      .eq('id', file.submission_id)
      .eq('form_id', file.form_id)
      .maybeSingle();
    if (!submission) throw new ApiError('This file could not be found.', 404);
    const { data, error: signError } = await service.storage
      .from('scribble-uploads')
      .createSignedUrl(file.path, 60, { download: file.name });
    if (signError) throw new ApiError('Could not open this file.', 503);
    return json({ url: data.signedUrl });
  });
}
