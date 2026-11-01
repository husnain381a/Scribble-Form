import Link from 'next/link';
import { Logo } from '@/components/ui';
export default function NotFound() {
  return (
    <main id="main" className="public-unavailable">
      <Logo />
      <span className="handwritten">a little off the page.</span>
      <h1>This corner is still blank.</h1>
      <p>We couldn’t find that page. There’s plenty more to explore.</p>
      <Link href="/" className="button button-dark">
        Back to Scribble →
      </Link>
    </main>
  );
}
