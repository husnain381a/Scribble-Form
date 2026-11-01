import Link from 'next/link';
import { ArrowUpRight, Check, Code2, Github, Heart } from 'lucide-react';
import { Nav, Footer } from '@/components/ui';
import { StructuredData } from '@/components/structured-data';
import { breadcrumbSchema, pageMetadata } from '@/lib/seo';
import { GITHUB_URL } from '@/lib/site';
export const metadata = pageMetadata('/open-source');
export default function Page() {
  return (
    <>
      <StructuredData data={breadcrumbSchema('Open source', '/open-source')} />
      <Nav />
      <main id="main" className="info-page section-wrap">
        <span className="eyebrow">FREE ISN’T A TRIAL. IT’S THE WHOLE IDEA.</span>
        <h1>
          Good tools.
          <br />
          <span className="handwritten coral">Open to everyone.</span>
        </h1>
        <p className="info-lead">
          Scribble is a free, open-source form builder for students, creators, and communities. Read
          the code, make it your own, or help make forms a little more human.
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
          <Github size={28} aria-hidden="true" />
          <h2>Built in the open. Better together.</h2>
          <p>
            The Scribble Forms project is maintained on GitHub by{' '}
            <a
              className="text-link"
              href="https://github.com/husnain381a"
              target="_blank"
              rel="noopener noreferrer"
            >
              husnain381a
            </a>{' '}
            and contributors. Browse the source, follow changes, report a bug, or contribute a
            useful improvement.
          </p>
          <div className="modal-actions">
            <a
              href={GITHUB_URL}
              className="button button-dark"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github size={18} aria-hidden="true" /> View on GitHub <ArrowUpRight size={16} />
            </a>
            <a
              href={`${GITHUB_URL}/blob/main/CONTRIBUTING.md`}
              className="text-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contributions welcome <ArrowUpRight size={16} />
            </a>
          </div>
        </section>
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
          <a
            href={GITHUB_URL}
            className="button button-dark"
            target="_blank"
            rel="noopener noreferrer"
          >
            Explore the source on GitHub <Github size={18} aria-hidden="true" />
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
