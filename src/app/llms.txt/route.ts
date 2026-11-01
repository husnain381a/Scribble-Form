import { absoluteUrl, GITHUB_URL, publicPages } from '@/lib/site';
export async function GET() {
  const text = [
    '# Scribble',
    '',
    '> A free, open-source form builder for surveys, sign-ups, events, and feedback.',
    '',
    'Scribble includes 15 question/content blocks, six themes, three typography styles, conditional questions, page and conversational layouts, private owner responses, and CSV exports.',
    '',
    'A creator must sign up or sign in before creating, editing, publishing, or managing forms. People answering a published form do not need an account.',
    '',
    'The software has no paid feature tiers. Operators hosting their own instance are responsible for infrastructure costs and limits.',
    '',
    '## Public information',
    ...publicPages.map(
      ({ path, name, description }) =>
        '- [' + name + '](' + absoluteUrl(path) + '): ' + description,
    ),
    '',
    '## Source and documentation',
    '- [GitHub repository](' + GITHUB_URL + ')',
    '- [Developer hosting guide](' + GITHUB_URL + '/blob/main/docs/DEPLOYMENT.md)',
    '- [Security model](' + GITHUB_URL + '/blob/main/SECURITY.md)',
    '- [License](' + GITHUB_URL + '/blob/main/LICENSE): AGPL-3.0-only.',
    '',
    '## Privacy',
    'Published questions are available through an unlisted form link. Drafts and responses are owner-restricted through access controls, not end-to-end encryption. Administrators may access stored data. Do not crawl or summarize account pages, drafts, responses, uploads, or respondent forms. Respect robots.txt and noindex directives.',
    '',
    'This optional file summarizes public project facts. It is not an access-control mechanism or a guarantee of search or AI-engine inclusion.',
    '',
  ].join('\n');
  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
