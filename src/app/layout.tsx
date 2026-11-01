import type { Metadata } from 'next';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/shantell-sans';
import '@fontsource/caveat/700.css';
import './globals.css';
import { Provider } from '@/components/provider';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: { default: 'Scribble — Forms with a little personality.', template: '%s · Scribble' },
  description:
    'Turn your questions into conversations. A free, open-source form builder for students, communities, and everyone with something to ask.',
  icons: { icon: '/icon.svg' },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
