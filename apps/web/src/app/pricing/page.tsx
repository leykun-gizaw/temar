import Link from 'next/link';
import SiteNavbar from '@/components/site-navbar';

interface Tier {
  name: string;
  price: string;
  period?: string;
  tagline: string;
  cta: string;
  href: string;
  highlighted?: boolean;
  features: string[];
  limitations?: string[];
}

const tiers: Tier[] = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    tagline: 'For students exploring structured learning',
    cta: 'Get Started',
    href: '/auth/register?plan=free',
    features: [
      'Unlimited topics',
      'Basic search',
      'Manual progress tracking',
      'Community updates (coming soon)',
    ],
    limitations: ['No real-time sync', 'Email support only'],
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/mo',
    tagline: 'Level up consistency & insight',
    cta: 'Start Pro Trial',
    href: '/auth/register?plan=pro',
    highlighted: true,
    features: [
      'Priority sync frequency',
      'Advanced filters & saved views',
      'Streak & velocity analytics',
      'Export to Notion / Markdown',
      'Upcoming spaced repetition hints',
    ],
    limitations: ['Single user only'],
  },
  {
    name: 'Team',
    price: '$29',
    period: '/mo',
    tagline: 'Collaborative learning hubs',
    cta: 'Contact Sales',
    href: '/contact?plan=team',
    features: [
      'Shared topic libraries',
      'Team progress dashboards',
      'Role-based access',
      'Custom integrations (API)',
      'Priority support',
    ],
    limitations: ['Seat limits apply (add-on tiers)'],
  },
];

export const metadata = {
  title: 'Pricing | Temar',
  description: 'Choose the Temar plan that fits your learning journey.',
};

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteNavbar />
      <main className="flex-1">
        <section className="relative border-b">
          <div className="text-center mx-auto max-w-5xl px-6 md:py-18">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Simple, transparent pricing
            </h1>
            <p className="text-center mt-6 text-lg text-muted-foreground">
              Start free. Upgrade only if Temar meaningfully improves the way
              you learn.
            </p>
          </div>
        </section>
        <section className="py-14 md:py-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-3">
            {tiers.map((tier) => {
              const CardTag = tier.highlighted ? 'div' : 'div';
              return (
                <CardTag
                  key={tier.name}
                  className={[
                    'relative flex flex-col rounded-2xl border bg-background p-6 shadow-sm',
                    tier.highlighted
                      ? 'ring-1 ring-primary/30 shadow-md md:scale-105 md:-translate-y-2'
                      : '',
                  ].join(' ')}
                >
                  {tier.highlighted && (
                    <span className="absolute -top-3 left-4 inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow">
                      Most Popular
                    </span>
                  )}
                  <h2 className="text-xl font-semibold tracking-tight">
                    {tier.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tier.tagline}
                  </p>
                  <div className="mt-6 flex items-end gap-1 font-semibold">
                    <span className="text-3xl">{tier.price}</span>
                    {tier.period && (
                      <span className="text-sm font-normal text-muted-foreground">
                        {tier.period}
                      </span>
                    )}
                  </div>
                  <Link
                    href={tier.href}
                    className={[
                      'mt-6 inline-flex h-10 items-center justify-center rounded-md px-5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      tier.highlighted
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'border border-input hover:bg-accent hover:text-accent-foreground',
                    ].join(' ')}
                  >
                    {tier.cta}
                  </Link>
                  <ul className="mt-6 space-y-2 text-sm">
                    {tier.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <span className="mt-1 inline-block h-1.5 w-1.5 flex-none rounded-full bg-primary" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  {tier.limitations && (
                    <div className="mt-6 border-t pt-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">
                        Limitations
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {tier.limitations.map((l) => (
                          <li key={l}>• {l}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardTag>
              );
            })}
          </div>
        </section>
      </main>
      <footer className="border-t py-10 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-6xl px-6">
          &copy; {new Date().getFullYear()} Temar. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
