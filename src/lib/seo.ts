import type { Metadata } from 'next';
import {
  absoluteUrl,
  GITHUB_URL,
  publicPages,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from './site';
import { faqs } from './site-content';

export function pageMetadata(path: (typeof publicPages)[number]['path']): Metadata {
  const page = publicPages.find((entry) => entry.path === path)!;
  const title = `${page.name} | ${SITE_NAME}`;
  const noIndex = process.env.VERCEL_ENV === 'preview';
  return {
    title: { absolute: title },
    description: page.description,
    alternates: { canonical: absoluteUrl(path) },
    robots: {
      index: !noIndex,
      follow: true,
      googleBot: {
        index: !noIndex,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      siteName: SITE_NAME,
      title,
      description: page.description,
      url: absoluteUrl(path),
      images: [
        {
          url: absoluteUrl('/og.png'),
          width: 1200,
          height: 630,
          alt: 'Scribble — Good questions. Great connections. Free, open-source forms.',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: page.description,
      images: [absoluteUrl('/og.png')],
    },
  };
}

export function privateMetadata(title: string): Metadata {
  return {
    title,
    robots: { index: false, follow: false, noarchive: true },
    alternates: { canonical: null },
  };
}

export function breadcrumbSchema(name: string, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name, item: absoluteUrl(path) },
    ],
  };
}

export const homeSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#project`,
      name: SITE_NAME,
      url: absoluteUrl('/'),
      logo: absoluteUrl('/logo.png'),
      sameAs: [GITHUB_URL],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      alternateName: 'Scribble Forms',
      url: absoluteUrl('/'),
      description: SITE_DESCRIPTION,
      inLanguage: 'en',
      publisher: { '@id': `${SITE_URL}/#project` },
    },
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/#application`,
      name: SITE_NAME,
      url: absoluteUrl('/'),
      description: SITE_DESCRIPTION,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web browser',
      isAccessibleForFree: true,
      license: `${GITHUB_URL}/blob/main/LICENSE`,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description:
          'Application software has no paid feature tiers. Hosting, storage, and email provider limits and costs apply.',
      },
      featureList: [
        '15 question and content blocks',
        'Six themes and three typography styles',
        'Conditional questions',
        'Page and conversational layouts',
        'Private form responses',
        'CSV exports',
        'Self-hosting',
      ],
      publisher: { '@id': `${SITE_URL}/#project` },
      softwareHelp: { '@type': 'WebPage', url: absoluteUrl('/setup') },
    },
    {
      '@type': 'SoftwareSourceCode',
      '@id': `${SITE_URL}/#source`,
      name: 'Scribble Forms source code',
      codeRepository: GITHUB_URL,
      url: GITHUB_URL,
      programmingLanguage: 'TypeScript',
      license: `${GITHUB_URL}/blob/main/LICENSE`,
      runtimePlatform: 'Node.js 22 or later',
      targetProduct: { '@id': `${SITE_URL}/#application` },
    },
  ],
};

export const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': absoluteUrl('/faq#questions'),
  url: absoluteUrl('/faq'),
  name: 'Scribble form builder questions and answers',
  inLanguage: 'en',
  isPartOf: { '@id': `${SITE_URL}/#website` },
  mainEntity: faqs.map(({ question, answer }) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: { '@type': 'Answer', text: answer },
  })),
};
