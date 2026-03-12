import SiteNavbar from '@/components/site-navbar';
import SiteFooter from '@/components/site-footer';
import { Heading, Text } from '@/components/shared/Typography';
import { Section } from '@/components/shared/Layout';
import Link from 'next/link';

export const metadata = {
  title: 'Refund Policy | Temar',
  description:
    'Refund policy for Temar subscriptions and Pass credit purchases.',
};

export default function RefundsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteNavbar />
      <main className="flex-1">
        <Section containerWidth="narrow" spacing="lg">
          <Heading as="h1" className="mb-4">
            Refund Policy
          </Heading>
          <Text variant="body-small" className="mb-10 text-muted-foreground">
            Last updated: March 2026
          </Text>

          <div className="space-y-10 text-muted-foreground leading-relaxed">
            <section>
              <Heading as="h2" className="text-foreground mb-4">
                1. Who Processes Payments
              </Heading>
              <p className="mb-4">
                Payments for Temar are processed by{' '}
                <strong>Paddle.net Market Ltd (&quot;Paddle&quot;)</strong>,
                acting as Merchant of Record. When you purchase a subscription or
                Pass pack, your contract for payment is with Paddle. For billing
                issues, disputes, or VAT receipts, contact Paddle directly at{' '}
                <Link
                  href="https://paddle.com/support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  paddle.com/support
                </Link>
                .
              </p>
            </section>

            <section>
              <Heading as="h2" className="text-foreground mb-4">
                2. Monthly Subscription Plans
              </Heading>
              <p className="mb-4">
                <strong>New subscriptions:</strong> You may request a full refund
                within 14 days of your first payment if you have not consumed any
                Pass credits. Requests after Pass consumption or after 14 days
                are not eligible.
              </p>
              <p className="mb-4">
                <strong>Renewals:</strong> Subscription renewals are
                non-refundable. You may cancel at any time through your account
                settings or via Paddle&apos;s customer portal to prevent future
                renewals. Cancellation takes effect at the end of the current
                billing period.
              </p>
              <p className="mb-4">
                <strong>Unused Pass credits at cancellation:</strong>{' '}
                Monthly-allocated Passes are forfeited on cancellation and are
                not refundable. Top-up pack Passes (purchased separately) remain
                accessible until expiry.
              </p>
            </section>

            <section>
              <Heading as="h2" className="text-foreground mb-4">
                3. Pass Top-Up Packs (One-Time Purchases)
              </Heading>
              <p className="mb-4">
                Top-up packs are refundable within 14 days of purchase if no
                Passes from the pack have been consumed. Once any Passes from the
                pack have been used, the purchase is non-refundable. Passes
                expire 12 months from the date of purchase.
              </p>
            </section>

            <section>
              <Heading as="h2" className="text-foreground mb-4">
                4. Consumed Pass Credits
              </Heading>
              <p className="mb-4">
                Pass credits that have been consumed in exchange for AI operations
                are non-refundable. This includes cases where the AI output was
                not to your satisfaction, as the computational cost has been
                incurred. If you believe a Pass deduction occurred due to a
                technical error on our part, contact{' '}
                <span className="font-medium text-foreground">
                  support@temar.app
                </span>{' '}
                within 7 days and we will investigate.
              </p>
            </section>

            <section>
              <Heading as="h2" className="text-foreground mb-4">
                5. EU and UK Consumer Rights
              </Heading>
              <p className="mb-4">
                If you are a consumer in the European Union or United Kingdom,
                you have a statutory right to withdraw from a digital service
                contract within 14 days of purchase. By purchasing and
                immediately using the Service (including consuming any Pass
                credits), you expressly request early performance of the contract
                and acknowledge that your right of withdrawal is lost upon first
                use.
              </p>
            </section>

            <section>
              <Heading as="h2" className="text-foreground mb-4">
                6. Billing Errors
              </Heading>
              <p className="mb-4">
                If you were charged incorrectly (e.g., charged twice, or charged
                the wrong amount), contact{' '}
                <span className="font-medium text-foreground">
                  support@temar.app
                </span>{' '}
                within 30 days. We will investigate and, where confirmed, issue a
                correction through Paddle.
              </p>
            </section>

            <section>
              <Heading as="h2" className="text-foreground mb-4">
                7. How to Request a Refund
              </Heading>
              <p className="mb-4">
                Email{' '}
                <strong className="text-foreground">support@temar.app</strong>{' '}
                with the subject line:{' '}
                <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                  Refund Request — [your email address]
                </code>
              </p>
              <p className="mb-4">Please include:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Your account email address</li>
                <li>The date of purchase</li>
                <li>The amount charged</li>
                <li>The reason for your request</li>
              </ul>
              <p className="mb-4">
                We aim to respond within 3 business days. Approved refunds are
                processed through Paddle and typically appear within 5–10
                business days depending on your bank.
              </p>
            </section>
          </div>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
