import { Suspense } from 'react';
import { Builder } from '@/components/builder';
import { Loading } from '@/components/ui';
import { privateMetadata } from '@/lib/seo';
export const metadata = privateMetadata('Form editor');
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main id="main">
      <Suspense fallback={<Loading />}>
        <Builder key={id} id={id} />
      </Suspense>
    </main>
  );
}
