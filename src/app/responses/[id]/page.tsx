import { Responses } from '@/components/responses';
import { privateMetadata } from '@/lib/seo';
export const metadata = privateMetadata('Form responses');
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Responses id={id} />;
}
