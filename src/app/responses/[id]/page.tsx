import { Responses } from '@/components/responses';
import { privateMetadata } from '@/lib/seo';
import { RequireAccount } from '@/components/require-account';
export const metadata = privateMetadata('Form responses');
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RequireAccount>
      <Responses id={id} />
    </RequireAccount>
  );
}
