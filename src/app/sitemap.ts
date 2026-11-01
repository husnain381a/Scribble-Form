import type { MetadataRoute } from 'next';
import { absoluteUrl, publicPages } from '@/lib/site';
export default function sitemap(): MetadataRoute.Sitemap {
  // No fabricated modification dates, query URLs, or user-generated form identifiers.
  return publicPages.map(({ path }) => ({ url: absoluteUrl(path) }));
}
