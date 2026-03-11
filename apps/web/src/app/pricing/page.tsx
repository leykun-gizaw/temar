import Link from 'next/link';
import SiteNavbar from '@/components/site-navbar';
import SiteFooter from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
        <section className="relative">
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
              return (
                <Card
                  key={tier.name}
                  className={cn(
                    'relative flex flex-col',
                    tier.highlighted &&
                      'ring-1 ring-primary/30 shadow-md md:scale-105 md:-translate-y-2'
                  )}
                >
                  {tier.highlighted && (
                    <span className="absolute -top-3 left-4 inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow">
                      Most Popular
                    </span>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{tier.name}</CardTitle>
                    <CardDescription>{tier.tagline}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex items-end gap-1 font-semibold mb-6">
                      <span className="text-3xl">{tier.price}</span>
                      {tier.period && (
                        <span className="text-sm font-normal text-muted-foreground">
                          {tier.period}
                        </span>
                      )}
                    </div>
                    <Button
                      asChild
                      variant={tier.highlighted ? 'default' : 'outline'}
                      className="w-full mb-6"
                    >
                      <Link href={tier.href}>{tier.cta}</Link>
                    </Button>
                    <ul className="space-y-2 text-sm">
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
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
