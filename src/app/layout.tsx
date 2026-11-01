import type { Metadata } from 'next';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/shantell-sans';
import '@fontsource/caveat/700.css';
import './globals.css';
import { Provider } from '@/components/provider';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: { default: 'Free open-source form builder | Scribble', template: '%s | Scribble' },
  description: SITE_DESCRIPTION,
  category: 'productivity',
  referrer: 'strict-origin-when-cross-origin',
  icons: { icon: '/icon.svg', apple: '/apple-touch-icon.png' },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: process.env.BING_SITE_VERIFICATION
      ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION }
      : undefined,
  },
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
