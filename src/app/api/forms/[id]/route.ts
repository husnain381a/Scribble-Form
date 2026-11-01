import { assertOwnForm, ApiError, json, route, removeFiles, checkOrigin } from '@/lib/server';
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    checkOrigin(request);
    const { id } = await params;
    const { db, form } = await assertOwnForm(request, id);
    if (form.status === 'published') {
      const { error: closeError } = await db
        .from('scribble_forms')
        .update({ status: 'closed' })
        .eq('id', id);
      if (closeError) throw new ApiError('Could not pause this form before deleting it.', 503);
    }
    await removeFiles(id);
    const { error } = await db.from('scribble_forms').delete().eq('id', id);
    if (error) throw new ApiError('Could not delete the form. Please try again.', 503);
    return json({ ok: true });
  });
}
