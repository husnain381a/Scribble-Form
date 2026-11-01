import type { MetadataRoute } from 'next';
import { absoluteUrl, SITE_URL } from '@/lib/site';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow:
        process.env.VERCEL_ENV === 'preview'
          ? ['/']
          : ['/api/', '/builder/', '/workspace', '/responses/', '/f/', '/login'],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL,
  };
}
