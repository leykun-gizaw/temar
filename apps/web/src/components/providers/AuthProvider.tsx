'use client';

import { AuthUIProvider } from '@daveyplate/better-auth-ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import { authClient } from '@/lib/auth-client';

export function BetterAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <AuthUIProvider
      authClient={authClient}
      navigate={router.push}
      replace={router.replace}
      onSessionChange={() => {
        // Clear router cache (protected routes)
        router.refresh();
      }}
      redirectTo="/dashboard"
      social={{ providers: ['google', 'github'] }}
      Link={Link}
    >
      {children}
    </AuthUIProvider>
  );
}
