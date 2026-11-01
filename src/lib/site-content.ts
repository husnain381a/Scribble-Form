export const faqs = [
  {
    id: 'what-is-scribble',
    question: 'What is Scribble?',
    answer:
      'Scribble is a free, open-source form builder for surveys, sign-ups, event RSVPs, and feedback. It combines a visual editor with customizable themes, conditional questions, page or conversational layouts, and a response dashboard. You can try it in a browser-local sandbox or self-host it with Supabase for shared forms and accounts.',
  },
  {
    id: 'free',
    question: 'Is Scribble really free?',
    answer:
      'Yes. All features in the Scribble source code are free, with no software subscription or paid feature tiers. The project is licensed under AGPL-3.0-only. Running a public instance still uses hosting, database storage, bandwidth, and email; your infrastructure providers set their own limits and costs.',
  },
  {
    id: 'code',
    question: 'Do I need to know how to code?',
    answer:
      'You do not need to code to make a form in a configured Scribble instance. Add questions in the editor, choose a theme, and publish. The browser-local sandbox works without API keys. Hosting your own instance requires a one-time Next.js and Supabase setup using the repository guide.',
  },
  {
    id: 'professional',
    question: 'Can I make it feel professional?',
    answer:
      'Yes. Scribble includes six themes, three typography styles, custom accent colors, and page or conversational layouts. Choose a clean style for a professional survey or a handwritten look for a more informal form. You can also customize the submit button and thank-you screen.',
  },
  {
    id: 'privacy',
    question: 'Who can see my responses?',
    answer:
      'In cloud mode, database row-level security restricts drafts and responses to the form owner. Respondents can submit without creating an account. Hosting administrators and infrastructure providers may also access stored data; this is not end-to-end encryption. In the sandbox, data stays in the current browser profile and is accessible to people using that profile.',
  },
  {
    id: 'sandbox',
    question: 'Can other people use a sandbox share link?',
    answer:
      'No. Sandbox forms and responses are stored in the current browser profile, and test files use IndexedDB. A sandbox link does not collect responses across devices or browsers. To share a real form with other people, use a configured Supabase instance, sign in, and publish the form from your account.',
  },
  {
    id: 'questions',
    question: 'Which question types does Scribble support?',
    answer:
      'Scribble has 15 question and content blocks: short answer, long answer, email, phone, number, URL, date, single choice, checkboxes, dropdown, star rating, scale, file upload, consent, and section heading. You can mark questions as required and use conditional visibility based on an earlier answer.',
  },
  {
    id: 'files',
    question: 'Can respondents upload files?',
    answer:
      'Yes. Published cloud forms can accept JPEG, PNG, WebP, PDF, and plain-text files up to 5 MB each. Files use private Supabase storage, non-overwriting signed uploads, and short-lived downloads authorized for the form owner. File contents are not virus-scanned. Browser-local sandbox uploads stay in the current browser.',
  },
  {
    id: 'export',
    question: 'Can I export or delete form responses?',
    answer:
      'Yes. The response dashboard lets the form owner search answers, inspect individual submissions, export responses as CSV, and delete responses and their attached files. A response stays linked to the version of the form that was answered, even if the owner later publishes different questions.',
  },
  {
    id: 'self-host',
    question: 'How do I self-host Scribble?',
    answer:
      'Clone the GitHub repository, use Node.js 22 or later, and install dependencies with npm ci. Create a Supabase project, apply all database migrations, add your environment values, and configure Auth redirects and email. Run the app locally or deploy the Next.js application to Vercel, then verify publishing, submissions, and owner-only access.',
  },
] as const;

export const homeFaqs = faqs.filter(({ id }) =>
  ['free', 'code', 'professional', 'privacy'].includes(id),
);
