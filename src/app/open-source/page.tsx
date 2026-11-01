import Link from 'next/link';
import { ArrowUpRight, Check, Code2, Heart } from 'lucide-react';
import { Nav, Footer } from '@/components/ui';
export const metadata = { title: 'Free is the whole idea' };
export default function Page() {
  return (
    <>
      <Nav />
      <main id="main" className="info-page section-wrap">
        <span className="eyebrow">FREE ISN’T A TRIAL. IT’S THE WHOLE IDEA.</span>
        <h1>
          Good tools.
          <br />
          <span className="handwritten coral">Open to everyone.</span>
        </h1>
        <p className="info-lead">
          A student’s first survey deserves the same care as a company’s next big launch. Scribble
          is built around that belief.
        </p>
        <div className="info-columns">
          <section>
            <Heart size={28} />
            <h2>Every feature. Every person.</h2>
            <p>
              All question types, themes, conditional questions, conversational forms, uploads, and
              response exports are included in the source. There is no premium switch waiting to be
              flipped.
            </p>
          </section>
          <section>
            <Code2 size={28} />
            <h2>Yours to understand.</h2>
            <p>
              The application source is licensed under AGPL-3.0. You can use it, study it, modify
              it, and self-host it. If you distribute a modified version or offer it over a network,
              share its corresponding source under the same license.
            </p>
          </section>
        </div>
        <section className="info-card">
          <h2>The honest bit about “free”.</h2>
          <p>
            The software has no feature charges. Running a public service still uses hosting,
            storage, bandwidth, and email. Vercel and Supabase free plans are useful for getting
            started; their current quotas and terms apply. This project doesn’t promise unlimited
            free infrastructure.
          </p>
          <p>
            You control your hosting accounts, data retention, backups, email configuration, and
            operating policies.
          </p>
          <Link href="/setup" className="text-link">
            Set up your own Scribble <ArrowUpRight size={17} />
          </Link>
        </section>
        <h2>A few things we believe.</h2>
        <ul className="beliefs">
          <li>
            <Check />
            Asking a question should feel easy.
          </li>
          <li>
            <Check />
            Privacy should be part of the foundation.
          </li>
          <li>
            <Check />
            Your work should be exportable.
          </li>
          <li>
            <Check />
            Useful tools should be understandable and open.
          </li>
        </ul>
        <div className="modal-actions">
          <a href="/source.zip" download className="button button-dark">
            Download the complete source <Code2 size={18} />
          </a>
          <Link href="/builder/new" className="button button-yellow">
            Make your first form <ArrowUpRight size={18} />
          </Link>
          <Link href="/templates" className="button">
            Borrow a little inspiration
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
