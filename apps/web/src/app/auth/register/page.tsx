import Link from 'next/link';
import { AuthCard } from '@/components/auth/auth-card';
import SiteNavbar from '@/components/site-navbar';
import { GoogleButton } from '@/components/auth/google-button';

export const metadata = {
  title: 'Create Account | Temar',
  description: 'Create your Temar account and start structuring your learning.',
};

interface RegisterPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  const rawPlan = searchParams?.plan;
  const plan = Array.isArray(rawPlan) ? rawPlan[0] : rawPlan;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/30">
      <SiteNavbar />
      <main className="flex flex-1 items-center justify-center p-6">
        <AuthCard
          title="Create your account"
          subtitle={
            plan
              ? `You're starting with the ${plan} plan. You can change this anytime.`
              : 'Start organizing topics and build momentum in your learning.'
          }
          footer={
            <p>
              Already have an account?{' '}
              <Link
                href="/auth/sign-in"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          }
        >
          <div className="space-y-6">
            <GoogleButton intent="register" />
            <div className="relative">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
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
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  placeholder="Your name"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
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
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="Repeat password"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Create Account
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
