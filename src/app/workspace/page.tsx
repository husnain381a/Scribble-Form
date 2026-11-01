import { Workspace } from '@/components/workspace';
import { privateMetadata } from '@/lib/seo';
export const metadata = privateMetadata('Your workspace');
export default function Page() {
  return <Workspace />;
}
