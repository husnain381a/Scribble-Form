import Home from '@/components/home';
import { StructuredData } from '@/components/structured-data';
import { homeSchema, pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata('/');
export default function Page() {
  return (
    <>
      <StructuredData data={homeSchema} />
      <Home />
    </>
  );
}
