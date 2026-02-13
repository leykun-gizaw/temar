import SiteNavbar from '@/components/site-navbar';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Temar',
  description:
    'Learn how Temar collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteNavbar />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
          <h1 className="text-3xl font-bold tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground mb-10">
            Last updated: February 13, 2025
          </p>

          <div className="space-y-10 text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                1. Who We Are (Data Controller)
              </h2>
              <p className="mb-4">
                Temar (&quot;Temar&quot;, &quot;we&quot;, &quot;us&quot;, or
                &quot;our&quot;) operates a spaced repetition and knowledge
                management platform (the &quot;Service&quot;).
              </p>
              <p className="mb-4">
                For purposes of applicable data protection laws, Temar is the
                data controller of your personal information.
              </p>
              <p className="mb-2">
                If you have any questions regarding this Privacy Policy or our
                data practices, you may contact us at:
              </p>
              <p className="font-medium text-foreground">
                Email: privacy@temar.app
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                2. Scope of This Policy
              </h2>
              <p className="mb-4">
                This Privacy Policy applies to all users of the Service,
                including:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Visitors to our website</li>
                <li>Registered users</li>
                <li>Free-tier users</li>
                <li>Paid subscribers</li>
              </ul>
              <p className="mb-4">
                This Policy describes how we collect, use, store, transfer, and
                protect your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                3. Legal Basis for Processing (GDPR Compliance)
              </h2>
              <p className="mb-4">
                Where applicable under the General Data Protection Regulation
                (GDPR) or similar laws, we process your personal data based on
                one or more of the following legal bases:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  <strong>Performance of a contract</strong> – to provide you
                  with the Service you request.
                </li>
                <li>
                  <strong>Legitimate interests</strong> – to improve the
                  Service, prevent fraud, and ensure security.
                </li>
                <li>
                  <strong>Legal obligations</strong> – to comply with applicable
                  laws and regulatory requirements.
                </li>
                <li>
                  <strong>Consent</strong> – where required (e.g., marketing
                  communications or optional integrations).
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                4. Information We Collect
              </h2>
              <p className="mb-4 font-medium text-foreground">
                4.1 Information You Provide Directly
              </p>
              <p className="mb-2 font-medium text-foreground text-sm">
                Account Information
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Name</li>
                <li>Email address</li>
                <li>
                  Encrypted password (hashed using industry-standard algorithms)
                </li>
                <li>Profile information</li>
              </ul>
              <p className="mb-2 font-medium text-foreground text-sm">
                User Content
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Notes, flashcards, topics, learning schedules</li>
                <li>Attachments and uploaded files</li>
                <li>Study history and progress tracking data</li>
                <li>Any content stored within your workspace</li>
              </ul>
              <p className="mb-4">You retain ownership of your User Content.</p>
              <p className="mb-2 font-medium text-foreground text-sm">
                Payment Information
              </p>
              <p className="mb-4">
                Subscription payments are processed through secure third-party
                providers such as Stripe. We do not store full credit card
                numbers.
              </p>
              <p className="mb-2 font-medium text-foreground text-sm">
                Communications
              </p>
              <p className="mb-4">Messages, support inquiries, and feedback.</p>

              <p className="mb-4 font-medium text-foreground mt-6">
                4.2 Information Collected Automatically
              </p>
              <p className="mb-4">When you use the Service, we collect:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>IP address</li>
                <li>Browser type and version</li>
                <li>Device type and operating system</li>
                <li>Log data and timestamps</li>
                <li>Feature usage data</li>
                <li>Study session activity and interaction metrics</li>
              </ul>
              <p className="mb-4">
                We use cookies and similar technologies for:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Authentication</li>
                <li>Session management</li>
                <li>Performance analytics</li>
                <li>Preference storage</li>
              </ul>

              <p className="mb-4 font-medium text-foreground mt-6">
                4.3 Information from Third Parties
              </p>
              <p className="mb-4">
                If you authenticate via third-party providers such as:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Google</li>
                <li>GitHub</li>
              </ul>
              <p className="mb-4">
                We may receive basic profile information (such as name and email
                address) as permitted by your account settings with those
                services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                5. How We Use Your Information
              </h2>
              <p className="mb-4">We use your information to:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Provide and maintain the Service</li>
                <li>Generate personalized spaced repetition schedules</li>
                <li>Synchronize data across devices</li>
                <li>Process subscription payments</li>
                <li>Improve platform performance and reliability</li>
                <li>Prevent fraud and unauthorized access</li>
                <li>Comply with legal obligations</li>
              </ul>
              <p className="mb-4">We do not sell your personal data.</p>
              <p className="mb-4">
                We do not use your User Content to train machine learning models
                without your explicit consent.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                6. Automated Processing and Profiling
              </h2>
              <p className="mb-4">
                The Service uses automated processing to generate study
                schedules and optimize learning intervals.
              </p>
              <p className="mb-4">However:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  We do not engage in automated decision-making that produces
                  legal or similarly significant effects.
                </li>
                <li>
                  You may contact us if you have questions about how
                  personalization features operate.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                7. Data Storage and Infrastructure
              </h2>
              <p className="mb-4 font-medium text-foreground">
                7.1 Hosting and Database Architecture
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  User data is stored in a secure PostgreSQL database
                  environment.
                </li>
                <li>
                  Infrastructure is hosted on secure cloud servers located in
                  the United States.
                </li>
                <li>
                  We use logical access controls to restrict internal access.
                </li>
                <li>
                  Data is separated between users through application-level
                  authorization controls.
                </li>
              </ul>
              <p className="mb-4 font-medium text-foreground mt-6">
                7.2 Security Measures
              </p>
              <p className="mb-4">We implement:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>TLS encryption for data in transit</li>
                <li>Encryption of sensitive data at rest</li>
                <li>Secure password hashing</li>
                <li>Role-based access controls</li>
                <li>Infrastructure monitoring</li>
                <li>Regular vulnerability assessments</li>
                <li>Automatic database backups</li>
              </ul>
              <p className="mb-4">
                While we implement industry-standard security safeguards, no
                system can guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                8. Data Retention
              </h2>
              <p className="mb-4">We retain personal information:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>For as long as your account remains active</li>
                <li>As necessary to fulfill contractual obligations</li>
                <li>As required by law</li>
              </ul>
              <p className="mb-4">If you delete your account:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Active system data is deleted within 30 days</li>
                <li>
                  Backup copies may persist for up to 90 days for disaster
                  recovery
                </li>
                <li>
                  Certain minimal records may be retained for fraud prevention
                  or legal compliance
                </li>
              </ul>
              <p className="mb-4">
                Backups are maintained for disaster recovery and are not
                intended as long-term archival storage.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                9. Data Sharing and Subprocessors
              </h2>
              <p className="mb-4">We share personal information only with:</p>
              <p className="mb-4 font-medium text-foreground">
                9.1 Service Providers
              </p>
              <p className="mb-4">Including:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Cloud hosting providers</li>
                <li>Payment processors</li>
                <li>Email delivery providers</li>
                <li>Analytics tools</li>
                <li>Infrastructure monitoring services</li>
              </ul>
              <p className="mb-4">
                These providers process data on our behalf under contractual
                confidentiality and security obligations.
              </p>
              <p className="mb-4">
                We maintain a list of subprocessors available upon request.
              </p>
              <p className="mb-4 font-medium text-foreground mt-6">
                9.2 Legal and Safety Reasons
              </p>
              <p className="mb-4">
                We may disclose data if required by law or to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Comply with court orders</li>
                <li>Protect rights and safety</li>
                <li>Prevent fraud or abuse</li>
              </ul>
              <p className="mb-4 font-medium text-foreground mt-6">
                9.3 Business Transfers
              </p>
              <p className="mb-4">
                In the event of merger, acquisition, restructuring, or asset
                sale, user information may be transferred. We will notify users
                of material changes in ownership or control.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                10. International Data Transfers
              </h2>
              <p className="mb-4">Our Service operates in the United States.</p>
              <p className="mb-4">
                If you access the Service from outside the United States, your
                data may be transferred and processed in the United States.
              </p>
              <p className="mb-4">
                Where required, we rely on appropriate safeguards such as
                Standard Contractual Clauses or equivalent legal mechanisms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                11. Data Breach Notification
              </h2>
              <p className="mb-4">
                In the event of a security breach affecting personal data, we
                will:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Investigate promptly</li>
                <li>Mitigate impact</li>
                <li>
                  Notify affected users and relevant authorities as required by
                  applicable law
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                12. Your Privacy Rights
              </h2>
              <p className="mb-4">
                Depending on your location, you may have rights including:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Access</li>
                <li>Correction</li>
                <li>Deletion</li>
                <li>Data portability</li>
                <li>Restriction of processing</li>
                <li>Objection to processing</li>
                <li>Withdrawal of consent</li>
              </ul>
              <p className="mb-4">
                To exercise these rights, contact:{' '}
                <span className="font-medium text-foreground">
                  privacy@temar.app
                </span>
              </p>
              <p className="mb-4">
                We will respond in accordance with applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                13. California Privacy Rights
              </h2>
              <p className="mb-4">
                If you are a California resident, you have rights under the
                CCPA/CPRA, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Right to know</li>
                <li>Right to delete</li>
                <li>Right to correct</li>
                <li>Right to opt out of sale (we do not sell data)</li>
                <li>Right to non-discrimination</li>
              </ul>
              <p className="mb-4">
                We do not respond to &quot;Do Not Track&quot; browser signals.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                14. Children&apos;s Privacy
              </h2>
              <p className="mb-4">
                The Service is not directed to children under 13 (or 16 where
                applicable). We do not knowingly collect personal data from
                children.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                15. Changes to This Policy
              </h2>
              <p className="mb-4">
                We may update this Privacy Policy periodically. Material changes
                will be communicated through the Service or via email.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                16. Contact Information
              </h2>
              <p className="font-medium text-foreground">
                Email: privacy@temar.app
              </p>
            </section>
          </div>
        </div>
      </main>
      <footer className="border-t py-10 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <span>
            &copy; {new Date().getFullYear()} Temar. All rights reserved.
          </span>
          <div className="flex gap-4">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
