import { Nav, Footer } from '@/components/ui';
export const metadata = { title: 'Your answers deserve care' };
export default function Page() {
  return (
    <>
      <Nav />
      <main id="main" className="info-page section-wrap">
        <span className="eyebrow">A LITTLE CLARITY</span>
        <h1>
          Your answers
          <br />
          <span className="handwritten coral">deserve care.</span>
        </h1>
        <p className="info-lead">
          Here’s how this application handles data. The organization running this instance is
          responsible for its privacy policy and legal obligations.
        </p>
        <h2>In the local sandbox</h2>
        <p>
          Forms and responses are saved in your browser’s local storage. Uploaded test files are
          saved in IndexedDB in the same browser. They don’t sync between devices or browser
          profiles. Clearing browser data removes them. Anyone using your browser profile may be
          able to access them.
        </p>
        <h2>With Supabase connected</h2>
        <p>
          Accounts, forms, and responses are stored in the host’s Supabase project. Published form
          questions are accessible to anyone with the form’s link. Drafts and responses are
          restricted to the account owning the form through database row-level security. Uploaded
          files use a private bucket with short-lived owner download links.
        </p>
        <h2>A word about “private”</h2>
        <p>
          This is access control, not end-to-end encryption. The form owner, hosting administrators,
          and infrastructure providers may be able to access stored data. Don’t collect passwords,
          payment card details, or highly sensitive information through this general-purpose form
          builder.
        </p>
        <h2>What the application collects</h2>
        <p>
          The answers and files a respondent submits, the form version, a random response
          identifier, and the submission time. Cloud endpoints also use a short-lived, hashed
          network identifier to limit abuse. The application includes no advertising trackers or
          analytics pixels. Infrastructure providers may maintain operational logs under their own
          policies.
        </p>
        <h2>Control and deletion</h2>
        <p>
          Form owners can export responses as CSV, delete individual responses and their files, or
          delete a form and all its responses. Account-level data requests should go to the operator
          of this instance. The operator should publish a contact address and retention period
          before accepting real-world responses.
        </p>
        <h2>Authentication</h2>
        <p>
          Supabase manages account credentials. The app uses the browser’s local session storage
          mechanism provided by the Supabase client. Signing out removes the app session on this
          device.
        </p>
      </main>
      <Footer />
    </>
  );
}
