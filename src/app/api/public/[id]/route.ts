import { published, json, route, limit } from '@/lib/server';
export const dynamic = 'force-dynamic';
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const { id } = await params;
    await limit(request, 'read', 180);
    const form = await published(id, true);
    return json(form.status === 'closed' ? { id: form.id, status: 'closed' } : form);
  });
}
