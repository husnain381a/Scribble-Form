import { Nav, Footer } from '@/components/ui';
import Link from 'next/link';
export const metadata = { title: 'Give Scribble a home' };
export default function Page() {
  return (
    <>
      <Nav />
      <main id="main" className="info-page section-wrap">
        <span className="eyebrow">A HOME FOR YOUR GOOD IDEAS</span>
        <h1>
          From sandbox
          <br />
          <span className="handwritten coral">to out in the world.</span>
        </h1>
        <p className="info-lead">
          The repository includes the full database migration, access policies, private file
          storage, and a step-by-step deployment guide.
        </p>
        <ol className="setup-steps">
          <li>
            <h2>Create your Supabase project.</h2>
            <p>
              Use a new project, or a separate namespace in a project you control. Run the SQL file
              in <code>supabase/migrations/</code> using the SQL editor, or run{' '}
              <code>supabase db push</code> from the repository.
            </p>
          </li>
          <li>
            <h2>Add your environment values.</h2>
            <p>
              Copy <code>.env.example</code> to <code>.env.local</code>. Set the Supabase URL,
              publishable key, server-only secret key, rate-limit secret, and app origin.
            </p>
          </li>
          <li>
            <h2>Run it locally.</h2>
            <p>
              <code>npm install</code>, then <code>npm run dev</code>. Open the local URL, create an
              account, and publish your first cloud form.
            </p>
          </li>
          <li>
            <h2>Deploy on Vercel.</h2>
            <p>
              Import the repository, choose Next.js, and add the same environment values. Set{' '}
              <code>APP_ORIGIN</code> to your deployed URL and allow that URL in Supabase Auth
              redirect settings. Keep email confirmation enabled; configure SMTP for a public
              service.
            </p>
          </li>
          <li>
            <h2>Check the whole conversation.</h2>
            <p>
              Publish a form, open its link in a separate browser, submit a response and a file, and
              verify only the owner can read them. The included cloud verification script checks the
              API and database access boundaries using test accounts you provide.
            </p>
          </li>
        </ol>
        <p>
          See the repository’s <code>README.md</code> and <code>docs/DEPLOYMENT.md</code> for exact
          commands, environment requirements, and maintenance details.
        </p>
        <Link href="/workspace" className="button button-dark">
          Explore your workspace →
        </Link>
      </main>
      <Footer />
    </>
  );
}
