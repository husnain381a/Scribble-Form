import { definitionSchema } from '@/lib/forms';
import { admin, ApiError, assertOwnForm, json, route, readJson, checkOrigin } from '@/lib/server';
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    checkOrigin(request);
    admin();
    const { id } = await params;
    const { db } = await assertOwnForm(request, id);
    const input = await readJson(request);
    const def = definitionSchema.parse((input as { definition?: unknown })?.definition);
    const { data, error } = await db.rpc('scribble_publish', { p_form_id: id, p_definition: def });
    if (error)
      throw new ApiError(
        'Could not publish this form. Check the database migration and try again.',
        503,
      );
    return json(data);
  });
}
