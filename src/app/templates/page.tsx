import Templates from '@/components/template-gallery';
import { StructuredData } from '@/components/structured-data';
import { breadcrumbSchema, pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata('/templates');
export default function Page() {
  return (
    <>
      <StructuredData data={breadcrumbSchema('Form templates', '/templates')} />
      <Templates />
    </>
  );
}
