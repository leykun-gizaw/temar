'use client';
import Link from 'next/link';
import { useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import Logo from '@/assets/logo';
import { ThemeToggle } from './theme-toggle';
import { authClient } from '@/lib/auth-client';
import { Button } from './ui/button';

interface NavLink {
  href: string;
  label: string;
}

const primaryLinks: NavLink[] = [{ href: '/pricing', label: 'Pricing' }];

const authLinks: NavLink[] = [
  { href: '/auth/sign-in', label: 'Sign In' },
  { href: '/auth/sign-up', label: 'Register' },
];

export function SiteNavbar() {
  const [open, setOpen] = useState(false);
  const { data, isPending } = authClient.useSession();

  if (isPending) {
    return '';
  }
  const isLoggedIn = !!data;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label="Temar home"
          >
            <Logo />
            <span className="hidden sm:inline font-bold text-xl">Temar</span>
          </Link>
          <nav
            aria-label="Main"
            className="hidden md:flex items-center gap-6 text-sm"
          >
            {primaryLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="hidden md:flex items-center gap-4 text-sm">
          {!isLoggedIn ? (
            authLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={
                  l.label === 'Register'
                    ? 'inline-flex h-9 items-center rounded-md bg-primary px-4 font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors'
                    : 'text-muted-foreground hover:text-foreground transition-colors'
                }
              >
                {l.label}
              </Link>
            ))
          ) : (
            <>
              <Link href={'/dashboard'}>
                <Button asChild variant={'outline'}>
                  <span>Dashboard</span>
                </Button>
              </Link>
              <Link href="/auth/sign-out">
                <Button asChild>
                  <span>
                    <LogOut /> Sign Out
                  </span>
                </Button>
              </Link>
            </>
          )}

          <ThemeToggle />
        </div>
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur">
          <nav
            className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-sm"
            aria-label="Mobile"
          >
            {primaryLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block rounded px-2 py-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 border-t pt-2" />
            {authLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={
                  l.label === 'Register'
                    ? 'block rounded bg-primary px-2 py-2 text-center font-medium text-primary-foreground hover:bg-primary/90'
                    : 'block rounded px-2 py-2 text-muted-foreground hover:bg-accent hover:text-foreground'
                }
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

export default SiteNavbar;
