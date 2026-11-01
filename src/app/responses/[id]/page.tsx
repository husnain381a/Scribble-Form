import { Responses } from '@/components/responses';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Responses id={id} />;
}
