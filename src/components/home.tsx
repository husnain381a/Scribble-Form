'use client';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  ChevronDown,
  Code2,
  Heart,
  MousePointer2,
  MoveRight,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Nav, Footer, CheckLine, DoodleArrow, Modal } from '@/components/ui';
import { FormRenderer } from '@/components/form-renderer';
import { templates, templateDefinition } from '@/lib/templates';
import { homeFaqs } from '@/lib/site-content';
import type { FormDefinition } from '@/lib/types';

const feedback = templateDefinition('feedback');
const demoDefinition: FormDefinition = {
  ...feedback,
  layout: 'conversation',
  description:
    'Try three questions, one at a time. This preview does not send or save your answers.',
  fields: feedback.fields.filter((field) => field.type !== 'email'),
  successTitle: 'That’s a Scribble form.',
  successMessage: 'Your turn? Create a free account and make something worth answering.',
};
export default function Home() {
  const [choice, setChoice] = useState('The good vibes');
  const [rating, setRating] = useState(4);
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    // Keep previously shared demo links useful as well as the homepage button.
    const openDemo = () => {
      if (window.location.hash === '#playground') setPreview(true);
    };
    openDemo();
    window.addEventListener('hashchange', openDemo);
    return () => window.removeEventListener('hashchange', openDemo);
  }, []);
  function closePreview() {
    setPreview(false);
    if (window.location.hash === '#playground')
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  return (
    <>
      <Nav />
      <main id="main">
        <section className="hero section-wrap">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="green-dot" />A FREE, OPEN-SOURCE FORM BUILDER
            </div>
            <h1>
              Good questions.
              <br />{' '}
              <span className="hero-highlight">
                Great connections.
                <svg viewBox="0 0 600 25" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M5 17 Q280 -1 592 12 M15 23 Q310 8 578 19" />
                </svg>
              </span>
            </h1>
            <p className="hero-description">
              Scribble is a free, open-source form builder.
              <br />
              Make yours feel like <span className="hand-highlight">a conversation.</span>
            </p>
            <div className="hero-buttons">
              <Link href="/builder/new" className="button button-yellow">
                Make your first form <ArrowUpRight size={20} />
              </Link>
              <button
                type="button"
                className="text-link"
                aria-haspopup="dialog"
                onClick={() => setPreview(true)}
              >
                Take it for a spin <MoveRight size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="hero-checks">
              <CheckLine>Free for everyone</CheckLine>
              <CheckLine>No card. No catch.</CheckLine>
            </div>
            <div className="hero-note">
              For your big ideas.
              <br />
              And the little ones, too.
              <DoodleArrow />
            </div>
          </div>
          <div className="hero-art" id="playground">
            <div className="floating-label">
              go on, try it out!
              <DoodleArrow />
            </div>
            <div className="back-paper" />
            <div className="demo-form">
              <div className="demo-top">
                <span className="mini-mark">s.</span>
                <span>YOUR FORM, YOUR PERSONALITY</span>
                <span className="dots">•••</span>
              </div>
              <div className="demo-form-body">
                <div className="handwritten demo-kicker">a very important question</div>
                <h2>
                  What makes
                  <br />
                  your day{' '}
                  <span className="sunny">
                    brighter
                    <svg viewBox="0 0 150 16" aria-hidden="true">
                      <path d="M4 8Q70 1 145 9" />
                    </svg>
                  </span>
                  ?
                </h2>
                <p>No wrong answers. Just good energy.</p>
                <div className="demo-options">
                  {['The good vibes', 'A little creativity', 'My kind of people'].map((c, i) => (
                    <button
                      key={c}
                      className={choice === c ? 'selected' : ''}
                      onClick={() => setChoice(c)}
                    >
                      <span className="choice-letter">{String.fromCharCode(65 + i)}</span>
                      {c}
                      {choice === c && <Check size={17} />}
                    </button>
                  ))}
                </div>
                <div className="demo-bottom">
                  <span>
                    <span className="progress-line">
                      <i />
                    </span>
                    1 of 3 questions
                  </span>
                  <Link
                    href="/builder/new?template=feedback"
                    className="demo-next"
                    aria-label="Make a form like this"
                  >
                    <ArrowRight size={22} />
                  </Link>
                </div>
              </div>
            </div>
            <div className="rating-sticker">
              <span>the feeling is mutual</span>
              <div>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} aria-label={`Give ${n} stars`} onClick={() => setRating(n)}>
                    <Star size={23} fill={rating >= n ? '#edb74a' : 'none'} />
                  </button>
                ))}
              </div>
              <b>A little feedback. A big smile.</b>
            </div>
            <div className="free-seal">
              <Heart size={18} />
              <span>
                100% FREE
                <br />
                100% YOURS
              </span>
            </div>
            <svg className="hero-spark" viewBox="0 0 70 70" aria-hidden="true">
              <path d="M35 4L39 27L61 16L45 34L66 42L42 43L45 65L32 47L14 62L23 40L3 32L27 29Z" />
            </svg>
          </div>
        </section>
        <section className="manifesto-strip">
          <span>
            Less <s>please fill out this form.</s>
          </span>
          <span className="strip-arrow">↝</span>
          <span>
            More <b className="handwritten">hey, let’s talk.</b>
          </span>
          <span className="strip-star">✳</span>
          <span>That’s the Scribble way.</span>
        </section>
        <section id="how-it-works" className="how-section section-wrap">
          <div className="section-heading">
            <div>
              <span className="eyebrow">FROM BLANK PAGE TO “THAT WAS EASY”</span>
              <h2>
                A little scribble.
                <br />A whole lot of possibility.
              </h2>
            </div>
            <p>
              For the club sign-ups. The next big launch.
              <br />
              The “just curious” surveys. Whatever you’re asking,
              <br />
              make it feel like you.
            </p>
          </div>
          <div className="how-grid">
            <article>
              <div className="step-art step-one">
                <span className="step-number">01</span>
                <div className="mini-editor">
                  <span>Let’s get to know you.</span>
                  <div>
                    <b>Aa</b> Your question goes here <i />
                  </div>
                  <button onClick={() => (location.href = '/builder/new')}>
                    <Plus size={15} /> Add a little something
                  </button>
                </div>
                <span className="art-note">Just start asking ↗</span>
              </div>
              <h3>Ask your way.</h3>
              <p>
                Type a question. Add a block. Make room for names, stories, stars, and everything in
                between.
              </p>
            </article>
            <article>
              <div className="step-art step-two">
                <span className="step-number">02</span>
                <div className="palette-papers">
                  <i />
                  <i />
                  <i />
                  <div>
                    A form
                    <br />
                    <em>with feeling.</em>
                    <span>● ● ●</span>
                  </div>
                </div>
                <span className="art-note">a little more you</span>
              </div>
              <h3>Give it some personality.</h3>
              <p>
                Switch up the colors, type, and rhythm. Go bold, keep it classic, or find your own
                happy middle.
              </p>
            </article>
            <article>
              <div className="step-art step-three">
                <span className="step-number">03</span>
                <div className="mini-response">
                  <span>
                    <CheckCheck size={18} /> One more good connection
                  </span>
                  <div>
                    <i>J</i>
                    <p>
                      “So glad you asked.”<small>New response · just now</small>
                    </p>
                    <Heart size={17} />
                  </div>
                </div>
                <svg className="mini-flight" viewBox="0 0 200 50" aria-hidden="true">
                  <path d="M3 39Q62 -5 110 25T195 5" />
                </svg>
                <span className="art-note">and let the answers roll in</span>
              </div>
              <h3>Send it into the world.</h3>
              <p>
                Share a link, collect responses, and find the story in your answers. All in one
                little workspace.
              </p>
            </article>
          </div>
        </section>
        <section className="template-section">
          <div className="section-wrap">
            <div className="section-heading">
              <div>
                <span className="eyebrow">A HEAD START NEVER HURT</span>
                <h2>Skip the blank-page feeling.</h2>
              </div>
              <Link href="/templates" className="text-link">
                Find your template <ArrowUpRight size={18} />
              </Link>
            </div>
            <div className="template-grid home-templates">
              {templates.slice(0, 3).map((t) => (
                <Link key={t.id} href={`/builder/new?template=${t.id}`} className="template-tile">
                  <div className={`template-preview theme-${t.theme}`}>
                    <div className="template-symbol">{t.symbol}</div>
                    <h3>{t.name}</h3>
                    <span className="fake-input" />
                    <span className="fake-input short" />
                    <span className="fake-submit">
                      Let’s do this <ArrowRight size={12} />
                    </span>
                  </div>
                  <div className="template-meta">
                    <div>
                      <b>
                        {t.category === 'Education'
                          ? 'Student research'
                          : t.category === 'Events'
                            ? 'The perfect RSVP'
                            : 'Fresh perspectives'}
                      </b>
                      <p>{t.description}</p>
                    </div>
                    <ArrowUpRight size={20} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
        <section className="free-section section-wrap">
          <div className="free-note">
            <span className="note-tape" />
            <span className="handwritten">
              The best things
              <br />
              aren’t behind
              <br />a paywall.
            </span>
            <Heart size={38} />
            <small>and that includes your ideas.</small>
          </div>
          <div className="free-copy">
            <span className="eyebrow">MADE FOR PEOPLE. NOT PAYWALLS.</span>
            <h2>
              Free isn’t a trial.
              <br />
              It’s the whole idea.
            </h2>
            <p>
              A student with a survey. A maker with a side project. A community with something to
              say. Everyone deserves great tools.
            </p>
            <div className="free-points">
              <span>
                <Check size={18} />
                Every question type
              </span>
              <span>
                <Check size={18} />
                Every theme and template
              </span>
              <span>
                <Check size={18} />
                Your data, yours to export
              </span>
              <span>
                <Check size={18} />
                Open source, always
              </span>
            </div>
            <Link href="/open-source" className="text-link">
              Meet the idea behind Scribble <ArrowRight size={17} />
            </Link>
            <p className="fine-print">
              No paid feature tiers. Self-host it on your own infrastructure.
              <br />
              Hosted storage and traffic depend on your provider’s limits.
            </p>
          </div>
        </section>
        <section className="features-line section-wrap">
          <div>
            <ShieldCheck />
            <b>Answers stay private.</b>
            <p>Only the form owner can read responses.</p>
          </div>
          <div>
            <Code2 />
            <b>Open by design.</b>
            <p>Read it. Remix it. Make it your own.</p>
          </div>
          <div>
            <Heart />
            <b>Everyone’s invited.</b>
            <p>Built for students, creators, and you.</p>
          </div>
        </section>
        <section className="faq-section section-wrap">
          <span className="eyebrow">A FEW GOOD QUESTIONS</span>
          <h2>Glad you asked.</h2>
          {homeFaqs.map(({ question, answer }) => (
            <details key={question}>
              <summary>
                {question}
                <Plus size={20} />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
          <Link href="/faq" className="text-link faq-more">
            More good questions, answered <ArrowUpRight size={17} />
          </Link>
        </section>
        <section className="closing-cta">
          <span className="handwritten">Your next good conversation starts here.</span>
          <h2>What will you ask?</h2>
          <Link href="/builder/new" className="button button-dark">
            Make something worth answering <ArrowUpRight size={20} />
          </Link>
          <p>Free to create. Yours to make.</p>
        </section>
      </main>
      <Footer />
      {preview && (
        <Modal title="Take Scribble for a spin" onClose={closePreview} wide>
          <div className="preview-frame">
            <FormRenderer definition={demoDefinition} preview />
          </div>
        </Modal>
      )}
    </>
  );
}
