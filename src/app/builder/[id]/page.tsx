import { Suspense } from 'react';
import { Builder } from '@/components/builder';
import { Loading } from '@/components/ui';
import { privateMetadata } from '@/lib/seo';
import { RequireAccount } from '@/components/require-account';
export const metadata = privateMetadata('Form editor');
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RequireAccount>
      <main id="main">
        <Suspense fallback={<Loading />}>
          <Builder key={id} id={id} />
        </Suspense>
      </main>
    </RequireAccount>
  );
}
