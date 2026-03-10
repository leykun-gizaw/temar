import Link from 'next/link';
import SiteNavbar from '@/components/site-navbar';
import SiteFooter from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Heading, Text } from '@/components/shared/Typography';
import { HeroSection, Section } from '@/components/shared/Layout';

export default function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteNavbar />
      <main className="flex-1">
        <HeroSection>
          <div className="max-w-3xl">
            <Heading as="h1">
              Master your learning with{' '}
              <span className="text-primary">Temar</span>
            </Heading>
            <Text variant="lead" className="mt-6">
              Organize topics, track progress, and stay consistent. Temar brings
              clarity and momentum to your self‑directed study plan.
            </Text>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button asChild size="lg">
                <Link href="/dashboard">Get Started</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </HeroSection>
        <Section className="border-t bg-muted/30">
          <div className="grid gap-10 md:grid-cols-3">
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
              <Card key={card.title} className="p-6">
                <CardHeader className="p-0">
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 mt-2">
                  <Text
                    variant="body-small"
                    className="text-muted-foreground leading-relaxed"
                  >
                    {card.body}
                  </Text>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
