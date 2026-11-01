'use client';
import { ErrorBox, Logo } from '@/components/ui';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="public-unavailable">
      <Logo />
      <h1>A little hiccup.</h1>
      <ErrorBox
        message="This page couldn’t load. Your saved forms are still in your workspace."
        retry={reset}
      />
    </main>
  );
}
