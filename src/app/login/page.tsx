import { Auth } from '@/components/auth';
import { privateMetadata } from '@/lib/seo';
export const metadata = privateMetadata('Make yourself at home');
export default function Page() {
  return <Auth />;
}
