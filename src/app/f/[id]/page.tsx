import { Suspense } from 'react';
import { PublicForm } from '@/components/public-form';
import { Loading } from '@/components/ui';
export const metadata = { title: 'A little conversation', robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<Loading />}>
      <PublicForm id={id} />
    </Suspense>
  );
}
