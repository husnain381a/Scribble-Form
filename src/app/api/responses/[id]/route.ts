import {
  owner,
  admin,
  ApiError,
  json,
  route,
  removeFiles,
  checkOrigin,
  validId,
} from '@/lib/server';
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    checkOrigin(request);
    const { id } = await params;
    validId(id);
    const { db } = await owner(request);
    const { data: response, error } = await db
      .from('scribble_submissions')
      .select('id,form_id')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new ApiError('Could not read this response.', 503);
    if (!response) throw new ApiError('This response is not in your workspace.', 404);
    await removeFiles(response.form_id, id);
    const { error: de } = await db.from('scribble_submissions').delete().eq('id', id);
    if (de) throw new ApiError('Could not delete this response.', 503);
    return json({ ok: true });
  });
}
