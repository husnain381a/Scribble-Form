import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Nav, Footer } from '@/components/ui';
import { StructuredData } from '@/components/structured-data';
import { breadcrumbSchema, pageMetadata } from '@/lib/seo';
import { GITHUB_URL } from '@/lib/site';
export const metadata = pageMetadata('/setup');
export default function Page() {
  return (
    <>
      <StructuredData data={breadcrumbSchema('Getting started', '/setup')} />
      <Nav />
      <main id="main" className="info-page section-wrap">
        <span className="eyebrow">YOUR NEXT GOOD CONVERSATION</span>
        <h1>
          From a question
          <br />
          <span className="handwritten coral">to a connection.</span>
        </h1>
        <p className="info-lead">
          Start with a free account. Make a form that feels like you, share it with your people, and
          keep every response in one place.
        </p>
        <ol className="setup-steps">
          <li>
            <h2>Make yourself at home.</h2>
            <p>
              Sign up with your email address, confirm your email, and sign in. Your account is
              where your forms and responses live.
            </p>
          </li>
          <li>
            <h2>Start asking.</h2>
            <p>
              Choose a template or a blank form. Add names, stories, choices, ratings, files, and
              anything else you need from the available question types.
            </p>
          </li>
          <li>
            <h2>Give it some personality.</h2>
            <p>
              Pick your colors, typography, and layout. Add conditional questions and a thank-you
              message, then preview your form on a phone or desktop.
            </p>
          </li>
          <li>
            <h2>Send it into the world.</h2>
            <p>
              Publish your form and share its link. People can answer without creating an account.
              Close the form whenever you want to stop accepting responses.
            </p>
          </li>
          <li>
            <h2>Find the story in your answers.</h2>
            <p>
              Open your response dashboard to review submissions, download attachments, search
              answers, and export a CSV. Your drafts and responses stay private to your account
              within the application.
            </p>
          </li>
        </ol>
        <div className="modal-actions">
          <Link href="/login?mode=signup&next=%2Fbuilder%2Fnew" className="button button-dark">
            Create your free account <ArrowUpRight size={17} />
          </Link>
          <Link href="/templates" className="button">
            Explore templates
          </Link>
        </div>
        <p>
          Want to run your own instance? The{' '}
          <a
            href={GITHUB_URL + '/blob/main/docs/DEPLOYMENT.md'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link"
          >
            developer and self-hosting guide
          </a>{' '}
          is on GitHub.
        </p>
      </main>
      <Footer />
    </>
  );
}
