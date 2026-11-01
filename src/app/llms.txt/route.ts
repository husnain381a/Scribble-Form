import { absoluteUrl, GITHUB_URL, publicPages } from '@/lib/site';
export async function GET() {
  const text = `# Scribble\n\n> A free, open-source form builder for surveys, sign-ups, events, and feedback.\n\nScribble includes 15 question/content blocks, six themes, three typography styles, conditional questions, page and conversational layouts, private owner responses, and CSV exports.\n\nThe software has no paid feature tiers. Infrastructure providers set their own hosting, storage, traffic, and email limits and costs.\n\n## Public information\n${publicPages.map(({ path, name, description }) => `- [${name}](${absoluteUrl(path)}): ${description}`).join('\n')}\n\n## Source and documentation\n- [GitHub repository](${GITHUB_URL})\n- [Self-hosting guide](${GITHUB_URL}/blob/main/docs/DEPLOYMENT.md)\n- [Security model](${GITHUB_URL}/blob/main/SECURITY.md)\n- [License](${GITHUB_URL}/blob/main/LICENSE): AGPL-3.0-only.\n\n## Important distinctions\nSandbox data stays in one browser profile; sandbox links do not collect responses across devices. Shared cloud forms require a configured Supabase project and a creator account.\nPublished questions are public through an unlisted form link. Drafts and responses are owner-restricted through access controls, not end-to-end encryption. Administrators may access stored data. Do not crawl or summarize account pages, drafts, responses, uploads, or respondent forms. Respect robots.txt and noindex directives.\n\nThis optional file summarizes public project facts. It is not an access-control mechanism or a guarantee of search or AI-engine inclusion.\n`;
  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
