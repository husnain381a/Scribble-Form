import { Nav, Footer } from '@/components/ui';
import { StructuredData } from '@/components/structured-data';
import { breadcrumbSchema, pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata('/privacy');
export default function Page() {
  return (
    <>
      <StructuredData data={breadcrumbSchema('Data privacy', '/privacy')} />
      <Nav />
      <main id="main" className="info-page section-wrap">
        <span className="eyebrow">A LITTLE CLARITY</span>
        <h1>
          Your answers
          <br />
          <span className="handwritten coral">deserve care.</span>
        </h1>
        <p className="info-lead">
          Here is how Scribble handles your account, forms, and responses. The organization running
          this instance is responsible for its privacy policy and legal obligations.
        </p>
        <h2>Your account and forms</h2>
        <p>
          You need to sign up or sign in to create and manage forms. Your account keeps your drafts,
          published forms, and responses together. Within the application, only the form owner can
          read drafts and responses or download attached files.
        </p>
        <h2>When you share a form</h2>
        <p>
          Anyone with a published form link can read its questions and submit a response without
          creating an account. Respondents cannot browse other responses. Uploaded files are
          private, and authorized download links expire shortly after they are issued.
        </p>
        <h2>A word about privacy</h2>
        <p>
          These are access controls, not end-to-end encryption. The form owner, hosting
          administrators, and infrastructure providers may be able to access stored data. Do not
          collect passwords, payment card details, or highly sensitive information through this
          general-purpose form builder.
        </p>
        <h2>What the application collects</h2>
        <p>
          Your account email address, the forms you create, the answers and files a respondent
          submits, the form version, a random response identifier, and the submission time. The
          service also uses a short-lived, hashed network identifier to limit abuse. The application
          includes no advertising trackers or analytics pixels. Hosting providers may keep
          operational logs under their own policies.
        </p>
        <h2>Control and deletion</h2>
        <p>
          Form owners can export responses as CSV, delete individual responses and their files, or
          delete a form and all its responses. Account-level data requests should go to the operator
          of this instance. The operator should publish a contact address and retention period
          before accepting real-world responses.
        </p>
        <h2>Signing in</h2>
        <p>
          Your sign-in session is saved on this device so you can return to your workspace. Sign out
          when using a shared device. Signing out removes the application session on that device.
        </p>
      </main>
      <Footer />
    </>
  );
}
