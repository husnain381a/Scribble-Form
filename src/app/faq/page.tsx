import Link from 'next/link';
import { ArrowUpRight, Github } from 'lucide-react';
import { Nav, Footer } from '@/components/ui';
import { StructuredData } from '@/components/structured-data';
import { breadcrumbSchema, faqSchema, pageMetadata } from '@/lib/seo';
import { faqs } from '@/lib/site-content';
import { GITHUB_URL } from '@/lib/site';

export const metadata = pageMetadata('/faq');
export default function Page() {
  return (
    <>
      <StructuredData data={faqSchema} />
      <StructuredData data={breadcrumbSchema('Frequently asked questions', '/faq')} />
      <Nav />
      <main id="main" className="info-page section-wrap faq-page">
        <span className="eyebrow">A LITTLE CLARITY GOES A LONG WAY</span>
        <h1>
          Good questions.
          <br />
          <span className="handwritten coral">Straight answers.</span>
        </h1>
        <p className="info-lead">
          Everything you need to know about making forms with Scribble: what’s free, how sharing
          works, and where your answers live.
        </p>
        <nav className="faq-jump-links" aria-label="Questions on this page">
          {faqs.map(({ id, question }) => (
            <a href={`#${id}`} key={id}>
              {question}
            </a>
          ))}
        </nav>
        <div className="faq-answers">
          {faqs.map(({ id, question, answer }) => (
            <section key={id} id={id}>
              <h2>{question}</h2>
              <p>{answer}</p>
            </section>
          ))}
        </div>
        <section className="info-card">
          <h2>Let’s make your first form.</h2>
          <p>Create your free account, choose a template, and make your first form.</p>
          <div className="modal-actions">
            <Link href="/templates" className="button button-yellow">
              Explore templates <ArrowUpRight size={17} />
            </Link>
            <Link href="/setup" className="button">
              Getting started
            </Link>
            <a href={GITHUB_URL} className="text-link" target="_blank" rel="noopener noreferrer">
              <Github size={17} aria-hidden="true" /> GitHub
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
