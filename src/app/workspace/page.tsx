import { Workspace } from '@/components/workspace';
import { privateMetadata } from '@/lib/seo';
import { RequireAccount } from '@/components/require-account';
export const metadata = privateMetadata('Your workspace');
export default function Page() {
  return (
    <RequireAccount>
      <Workspace />
    </RequireAccount>
  );
}
