export const SITE_NAME = 'Scribble';
export const SITE_TITLE_PREFIX = 'Scribble Form';
export const SITE_KEYWORDS = [
  'Scribble Form',
  'Scribble Forms',
  'free form builder',
  'open-source form builder',
  'online forms',
  'customizable forms',
  'self-hosted forms',
] as const;
export const SITE_URL = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || 'https://scribble-form.vercel.app',
).origin;
export const GITHUB_URL = 'https://github.com/husnain381a/Scribble-Forms';
export const SITE_DESCRIPTION =
  'Create surveys, sign-up forms, and feedback with Scribble, a free open-source form builder. Sign up, customize your questions and themes, and share your form.';

export const publicPages = [
  {
    path: '/',
    name: 'Free open-source form builder',
    description: SITE_DESCRIPTION,
    keywords: ['survey builder', 'registration forms', 'feedback forms', 'student forms'],
  },
  {
    path: '/templates',
    name: 'Free form templates for surveys, events, and feedback',
    keywords: [
      'form templates',
      'RSVP forms',
      'student research surveys',
      'contact form templates',
    ],
    description:
      'Start with free form templates for event RSVPs, feedback, student research, clubs, contact forms, and creative briefs. Customize every question in Scribble.',
  },
  {
    path: '/faq',
    name: 'Form builder FAQ: pricing, privacy, and hosting',
    keywords: ['form builder FAQ', 'form privacy', 'free form software', 'form hosting'],
    description:
      'Learn how Scribble forms work: free accounts, question types, conditional logic, file uploads, private responses, sharing links, and CSV exports.',
  },
  {
    path: '/open-source',
    name: 'Open-source form builder: source and contributions',
    keywords: [
      'open-source forms',
      'GitHub form builder',
      'AGPL form builder',
      'Scribble contributions',
    ],
    description:
      'Explore Scribble on GitHub. Read the AGPL-3.0 source, contribute improvements, and self-host a customizable form builder with no paid software feature tiers.',
  },
  {
    path: '/setup',
    name: 'Getting started with your free Scribble account',
    keywords: ['create a form', 'free form account', 'publish forms', 'share forms'],
    description:
      'Create a free Scribble account, choose a template, customize your questions, publish your form, and review responses. Follow this simple getting-started guide.',
  },
  {
    path: '/privacy',
    name: 'Form data privacy and security',
    keywords: [
      'form data privacy',
      'private form responses',
      'form security',
      'private file uploads',
    ],
    description:
      'Understand how Scribble handles accounts, form answers, and private file uploads, including sharing, owner access, deletion, and hosting responsibilities.',
  },
] as const;

export function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

export function isPrivatePath(path: string) {
  return /^\/(?:api|builder|workspace|responses|f|login)(?:\/|$)/.test(path);
}

// Static project data only; never put form drafts or respondent answers in JSON-LD.
export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
