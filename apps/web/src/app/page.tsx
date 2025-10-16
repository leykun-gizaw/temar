import Link from 'next/link';
import SiteNavbar from '@/components/site-navbar';
import SiteFooter from '@/components/site-footer';

export default function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteNavbar />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 select-none [background:radial-gradient(circle_at_center,theme(colors.primary/15)_0%,transparent_70%)]" />
          <div className="mx-auto max-w-6xl px-6 py-24 md:py-32 lg:py-40">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Master your learning with{' '}
                <span className="text-primary">Temar</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Organize topics, track progress, and stay consistent. Temar
                brings clarity and momentum to your self‑directed study plan.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link
                  href="/auth/sign-up"
                  className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Get Started
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="border-t bg-muted/30">
          <div className="mx-auto max-w-6xl px-6 py-16 grid gap-10 md:grid-cols-3">
            {[
              {
                title: 'Stay Organized',
                body: 'Group and search topics effortlessly so you always know what to learn next.',
              },
              {
                title: 'Track Progress',
                body: 'Capture what you have covered and what remains with simple, actionable structure.',
              },
              {
                title: 'Stay Consistent',
                body: 'Reduce friction and context switching—focus on incremental wins every day.',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-xl border bg-background p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
