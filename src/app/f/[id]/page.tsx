import { Suspense } from 'react';
import { PublicForm } from '@/components/public-form';
import { Loading } from '@/components/ui';
import { privateMetadata } from '@/lib/seo';
export const metadata = privateMetadata('A little conversation');
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<Loading />}>
      <PublicForm id={id} />
    </Suspense>
  );
}
