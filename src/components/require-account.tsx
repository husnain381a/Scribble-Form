'use client';
import Link from 'next/link';
import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from './provider';
import { Loading, Logo } from './ui';
import { signInLocation } from '@/lib/auth-routing';

// This gate prevents owner tools from mounting for guests. Database RLS and
// authenticated server routes remain the authorization boundary for all data.
export function RequireAccount({ children }: { children: ReactNode }) {
  const { ready, user } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (ready && !user) router.replace(signInLocation(pathname + window.location.search));
  }, [ready, user, pathname, router]);
  if (!ready || !user)
    return (
      <main id="main" className="account-gate">
        <Logo />
        <Loading text={ready ? 'Taking you to sign in…' : 'Checking your account…'} />
        <Link href={signInLocation(pathname)} className="text-link">
          Sign in to continue
        </Link>
      </main>
    );
  return children;
}
