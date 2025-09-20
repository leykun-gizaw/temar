import Link from 'next/link';
import { AuthCard } from '@/components/auth/auth-card';
import SiteNavbar from '@/components/site-navbar';
import { GoogleButton } from '@/components/auth/google-button';

export const metadata = {
  title: 'Sign In | Temar',
  description: 'Access your Temar learning dashboard.',
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/30">
      <SiteNavbar />
      <main className="flex flex-1 items-center justify-center p-6">
        <AuthCard
          title="Welcome back"
          subtitle="Sign in to continue tracking and refining your learning journey."
          footer={
            <p>
              New here?{' '}
              <Link
                href="/auth/register"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Create an account
              </Link>
            </p>
          }
        >
          <div className="space-y-6">
            <GoogleButton intent="signin" />
            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 text-xs uppercase tracking-wide text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>
            <form className="space-y-5" noValidate>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Forgot?
                  </Link>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Sign In
              </button>
            </form>
          </div>
        </AuthCard>
      </main>
      <footer className="py-6 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Temar. All rights reserved.
      </footer>
    </div>
  );
}
