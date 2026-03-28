import Link from 'next/link';
import SiteNavbar from '@/components/site-navbar';
import SiteFooter from '@/components/site-footer';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  cn,
} from '@temar/ui';
import { Check, Coins, Zap } from 'lucide-react';
import { getLoggedInUser } from '@/lib/fetchers/users';

interface Tier {
  name: string;
  price: string;
  period?: string;
  tagline: string;
  passPerMonth: string;
  cta: string;
  ctaLoggedIn: string;
  href: string;
  hrefLoggedIn: string;
  highlighted?: boolean;
  features: string[];
}

const tiers: Tier[] = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    tagline: 'Bring your own API key',
    passPerMonth: '0 Pass/mo',
    cta: 'Get Started',
    ctaLoggedIn: 'Current Plan',
    href: '/auth/register',
    hrefLoggedIn: '/dashboard',
    features: [
      'BYOK — use your own AI API key',
      'Question generation (BYOK)',
      'Answer analysis (BYOK)',
      'Spaced repetition (FSRS)',
      'Unlimited topics & notes',
      'Notion import',
    ],
  },
  {
    name: 'Starter',
    price: '$4.99',
    period: '/mo',
    tagline: 'Managed AI, no key needed',
    passPerMonth: '100 Pass/mo',
    cta: 'Start Starter',
    ctaLoggedIn: 'Upgrade to Starter',
    href: '/auth/register?plan=starter',
    hrefLoggedIn: '/dashboard/billing',
    features: [
      '100 Pass per month (rolls over up to 30)',
      'Managed AI — no API key required',
      'Question generation & answer analysis',
      'Economy & Standard model tiers',
      'All Free features included',
      'Top-up packs available',
    ],
  },
  {
    name: 'Hobbyist',
    price: '$9.99',
    period: '/mo',
    tagline: 'More Pass for regular learners',
    passPerMonth: '200 Pass/mo',
    cta: 'Go Hobbyist',
    ctaLoggedIn: 'Upgrade to Hobbyist',
    href: '/auth/register?plan=hobbyist',
    hrefLoggedIn: '/dashboard/billing',
    highlighted: true,
    features: [
      '200 Pass per month (rolls over up to 60)',
      'Managed AI — no API key required',
      'Question generation & answer analysis',
      'Economy & Standard model tiers',
      'All Free features included',
      'Top-up packs available',
    ],
  },
  {
    name: 'Scholar',
    price: '$14.99',
    period: '/mo',
    tagline: 'Power users & premium models',
    passPerMonth: '300 Pass/mo',
    cta: 'Go Scholar',
    ctaLoggedIn: 'Upgrade to Scholar',
    href: '/auth/register?plan=scholar',
    hrefLoggedIn: '/dashboard/billing',
    features: [
      '300 Pass per month (rolls over up to 100)',
      'Access to Premium model tier',
      'All Hobbyist features included',
      'Priority support',
      'Top-up packs available',
    ],
  },
];

const topups = [
  { pass: 50, price: '$2.49', perPass: '$0.050' },
  { pass: 100, price: '$4.99', perPass: '$0.050', best: true },
];

export const metadata = {
  title: 'Pricing | Temar',
  description: 'Simple, transparent pricing for AI-powered learning.',
};

export default async function PricingPage() {
  const sessionUser = await getLoggedInUser();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteNavbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 md:py-24 text-center">
          <div className="mx-auto max-w-3xl px-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Pricing
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Bring your own API key for free, or let Temar handle it with a
              Pass subscription. Top up anytime.
            </p>
          </div>
        </section>

        {/* Tiers */}
        <section className="pb-16 md:pb-24">
          <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-2 lg:grid-cols-4">
            {tiers.map((tier) => (
              <Card
                key={tier.name}
                className={cn(
                  'relative flex flex-col',
                  tier.highlighted &&
                    'ring-2 ring-primary shadow-lg md:scale-105 md:-translate-y-2'
                )}
              >
                {tier.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">
                    Most Popular
                  </span>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.tagline}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-6">
                  <div>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-bold">{tier.price}</span>
                      {tier.period && (
                        <span className="mb-1 text-sm text-muted-foreground">
                          {tier.period}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-sm text-primary font-medium">
                      <Coins className="h-3.5 w-3.5" />
                      {tier.passPerMonth}
                    </div>
                  </div>

                  <Button
                    asChild
                    variant={tier.highlighted ? 'default' : 'outline'}
                    className="w-full"
                  >
                    <Link href={sessionUser ? tier.hrefLoggedIn : tier.href}>
                      {sessionUser ? tier.ctaLoggedIn : tier.cta}
                    </Link>
                  </Button>

                  <ul className="space-y-2 text-sm flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex gap-2 items-start">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Top-up packs */}
        <section className="py-16 bg-muted/40">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold">Pass Top-up Packs</h2>
              <p className="mt-2 text-muted-foreground">
                Need more Pass mid-month? Buy once, use anytime. No expiry.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 max-w-2xl mx-auto">
              {topups.map((pack) => (
                <Card
                  key={pack.pass}
                  className={cn(
                    'relative flex flex-col items-center text-center py-6 px-4',
                    pack.best && 'ring-2 ring-primary/60'
                  )}
                >
                  {pack.best && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      <Zap className="h-3 w-3" /> Best value
                    </span>
                  )}
                  <Coins className="h-8 w-8 text-primary mb-3" />
                  <p className="text-3xl font-bold">{pack.pass}</p>
                  <p className="text-sm text-muted-foreground mb-1">Pass</p>
                  <p className="text-xl font-semibold">{pack.price}</p>
                  <p className="text-xs text-muted-foreground mb-5">
                    {pack.perPass} per Pass
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/dashboard/billing">Buy Pack</Link>
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
