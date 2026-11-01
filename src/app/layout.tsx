import type { Metadata } from 'next';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/shantell-sans';
import '@fontsource/caveat/700.css';
import './globals.css';
import { Provider } from '@/components/provider';
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TITLE_PREFIX,
  SITE_URL,
} from '@/lib/site';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: `${SITE_TITLE_PREFIX} | Free open-source form builder`,
    template: `${SITE_TITLE_PREFIX} | %s`,
  },
  description: SITE_DESCRIPTION,
  keywords: [...SITE_KEYWORDS],
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
