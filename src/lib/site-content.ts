export const faqs = [
  {
    id: 'what-is-scribble',
    question: 'What is Scribble?',
    answer:
      'Scribble is a free, open-source form builder for surveys, sign-ups, event RSVPs, and feedback. It combines a visual editor with customizable themes, conditional questions, page or conversational layouts, and a response dashboard. Create an account, make your form, and share its link with the people you want to hear from.',
  },
  {
    id: 'free',
    question: 'Is Scribble really free?',
    answer:
      'Yes. Scribble has no software subscription or paid feature tiers. You can create an account and use all included question types, themes, conditional questions, and response exports. The source is licensed under AGPL-3.0-only. Operators hosting their own instance are responsible for their infrastructure costs and limits.',
  },
  {
    id: 'code',
    question: 'Do I need to know how to code?',
    answer:
      'No. Create your free account, add questions in the editor, choose a theme, and publish. You can start with a ready-made template or a blank form. The editor handles the form layout and sharing link, so you can focus on the questions you want to ask.',
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
      'Your forms and responses belong to your account. Within the application, only the form owner can view drafts, review responses, and download attached files. Hosting administrators and infrastructure providers may also access stored data; this is not end-to-end encryption. Anyone with a published form link can see its questions and submit an answer.',
  },
  {
    id: 'account',
    question: 'Do I need an account to create a form?',
    answer:
      'Yes. Sign up or sign in before creating, editing, publishing, or managing forms. Your account keeps your forms and responses together. People answering a published form do not need a Scribble account.',
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
      "Yes. Published forms can accept JPEG, PNG, WebP, PDF, and plain-text files up to 5 MB each. Files are stored privately, and downloads require the form owner's authorization. Download links expire shortly after they are issued. File contents are not virus-scanned.",
  },
  {
    id: 'export',
    question: 'Can I export or delete form responses?',
    answer:
      'Yes. The response dashboard lets the form owner search answers, inspect individual submissions, export responses as CSV, and delete responses and their attached files. A response stays linked to the version of the form that was answered, even if the owner later publishes different questions.',
  },
  {
    id: 'self-host',
    question: 'Can I host Scribble myself?',
    answer:
      'Yes. Scribble is open source under AGPL-3.0-only. The GitHub repository includes the source, installation instructions, and a deployment guide for running your own instance. Instance operators manage their hosting, account settings, backups, and retention policies. Signing in is required to create forms on every instance.',
  },
] as const;
export const homeFaqs = faqs.filter(({ id }) =>
  ['free', 'code', 'professional', 'privacy'].includes(id),
);
