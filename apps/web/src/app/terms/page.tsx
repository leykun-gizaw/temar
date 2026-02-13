import SiteNavbar from '@/components/site-navbar';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | Temar',
  description: 'Terms and conditions for using Temar.',
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteNavbar />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
          <h1 className="text-3xl font-bold tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground mb-10">
            Last updated: February 13, 2025
          </p>

          <div className="space-y-10 text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="mb-4">
                Welcome to Temar (&quot;we,&quot; &quot;our,&quot; or
                &quot;us&quot;). These Terms of Service (&quot;Terms&quot;)
                constitute a legally binding agreement between you
                (&quot;you&quot; or &quot;User&quot;) and Temar, a provider of
                spaced repetition and learning management software services
                (collectively, the &quot;Service&quot;).
              </p>
              <p className="mb-4">
                By accessing, registering for, or using the Service, you
                acknowledge that you have read, understood, and agree to be
                bound by these Terms. If you do not agree to these Terms, you
                must not access or use the Service. These Terms apply to all
                visitors, users, and others who access or use the Service.
              </p>
              <p className="mb-4">
                If you are using the Service on behalf of an organization,
                company, or other entity (such as your employer), you represent
                and warrant that you have the full legal authority to bind that
                organization to these Terms. In such cases, &quot;you&quot; and
                &quot;User&quot; will refer to that organization, and you agree
                to these Terms on behalf of that organization.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                2. Definitions
              </h2>
              <p className="mb-4">
                For the purposes of these Terms, the following definitions
                apply:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  <strong>&quot;Account&quot;</strong> means your registered
                  user account for accessing and using the Service.
                </li>
                <li>
                  <strong>&quot;Content&quot;</strong> means any text, data,
                  information, images, photographs, videos, audio, documents, or
                  other materials.
                </li>
                <li>
                  <strong>&quot;Service&quot;</strong> means the Temar spaced
                  repetition and learning management platform, including all
                  features, functionality, websites, mobile applications, APIs,
                  and other interfaces provided by us.
                </li>
                <li>
                  <strong>&quot;User Content&quot;</strong> means any Content
                  that you upload, submit, post, create, store, or otherwise
                  make available through the Service, including but not limited
                  to learning topics, study notes, flashcards, spaced repetition
                  schedules, progress tracking data, and attachments.
                </li>
                <li>
                  <strong>&quot;Subscription Plan&quot;</strong> means the
                  specific pricing tier and feature set you have selected for
                  your Account (e.g., Free, Pro, Team).
                </li>
                <li>
                  <strong>&quot;Intellectual Property Rights&quot;</strong>{' '}
                  means all patent rights, copyright rights, trademark rights,
                  trade secret rights, moral rights, and any other intellectual
                  property rights recognized in any jurisdiction worldwide.
                </li>
                <li>
                  <strong>&quot;Confidential Information&quot;</strong> means
                  any non-public information disclosed by either party that is
                  designated as confidential or that reasonably should be
                  understood to be confidential given the nature of the
                  information and the circumstances of disclosure.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                3. Eligibility and Account Registration
              </h2>
              <p className="mb-4 font-medium text-foreground">
                3.1 Age and Capacity Requirements
              </p>
              <p className="mb-4">
                You must be at least 13 years of age to use the Service. By
                using the Service, you represent and warrant that: (a) you meet
                the minimum age requirement; (b) you have the legal capacity to
                enter into a binding contract; (c) you are not barred from using
                the Service under any applicable laws; and (d) all information
                you provide is accurate, complete, and current.
              </p>

              <p className="mb-4 font-medium text-foreground mt-6">
                3.2 Account Creation and Security
              </p>
              <p className="mb-4">
                To access certain features, you must create an Account by
                providing accurate information including your name and email
                address. You are solely responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  Maintaining the confidentiality of your Account credentials
                  (username, password, API keys, or access tokens).
                </li>
                <li>
                  All activities that occur under your Account, whether
                  authorized by you or not.
                </li>
                <li>
                  Immediately notifying us of any unauthorized use, security
                  breach, or suspected compromise of your Account.
                </li>
                <li>
                  Ensuring that you log out from your Account at the end of each
                  session when using a shared or public computer.
                </li>
              </ul>
              <p className="mb-4">
                We reserve the right to suspend or terminate your Account if any
                information you provide is inaccurate, false, misleading, or
                incomplete. You may not create multiple Accounts, share your
                Account credentials with others, or transfer your Account to any
                third party without our prior written consent.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                4. Subscription Plans and Payment
              </h2>
              <p className="mb-4 font-medium text-foreground">
                4.1 Subscription Terms
              </p>
              <p className="mb-4">
                We offer various Subscription Plans with different features and
                pricing. By selecting a paid Subscription Plan, you agree to pay
                all applicable fees as described at the time of purchase. All
                fees are exclusive of taxes, and you are responsible for paying
                all applicable taxes.
              </p>

              <p className="mb-4 font-medium text-foreground mt-6">
                4.2 Billing and Renewal
              </p>
              <p className="mb-4">
                Paid subscriptions automatically renew for successive periods
                equal to your initial subscription term unless cancelled before
                the renewal date. You authorize us to charge your payment method
                for all renewal fees. You may cancel your subscription at any
                time through your Account settings, and cancellation will take
                effect at the end of your current billing period.
              </p>

              <p className="mb-4 font-medium text-foreground mt-6">
                4.3 Refunds
              </p>
              <p className="mb-4">
                Unless otherwise required by applicable law, all fees are
                non-refundable. We do not provide refunds for partial months of
                service, unused features, or downgrades. If you believe you were
                charged in error, you must contact us within 30 days of the
                charge to dispute it.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                5. License and Restrictions
              </h2>
              <p className="mb-4 font-medium text-foreground">
                5.1 Grant of License
              </p>
              <p className="mb-4">
                Subject to your compliance with these Terms, we grant you a
                limited, non-exclusive, non-transferable, non-sublicensable,
                revocable license to access and use the Service for your
                personal, non-commercial learning purposes (or internal business
                purposes if using a Team plan). This license does not permit you
                to resell, redistribute, or make the Service available to
                unauthorized third parties.
              </p>

              <p className="mb-4 font-medium text-foreground mt-6">
                5.2 Prohibited Activities
              </p>
              <p className="mb-4">
                You agree not to engage in any of the following prohibited
                activities:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  Reverse engineering, decompiling, disassembling, or otherwise
                  attempting to derive the source code of the Service.
                </li>
                <li>
                  Removing, altering, or obscuring any copyright, trademark, or
                  proprietary rights notices.
                </li>
                <li>
                  Circumventing any security features, authentication measures,
                  or usage limitations of the Service.
                </li>
                <li>
                  Using automated systems (bots, scrapers, crawlers, spiders) to
                  access the Service without our express written permission.
                </li>
                <li>
                  Interfering with or disrupting the Service, servers, or
                  networks connected to the Service.
                </li>
                <li>
                  Attempting to gain unauthorized access to any portion of the
                  Service, other users&apos; Accounts, or our systems.
                </li>
                <li>
                  Overloading our infrastructure through excessive requests,
                  resource abuse, or denial-of-service attacks.
                </li>
                <li>
                  Using the Service for any illegal purpose or in violation of
                  any applicable laws.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                6. User Content
              </h2>
              <p className="mb-4 font-medium text-foreground">6.1 Ownership</p>
              <p className="mb-4">
                You retain all ownership rights, title, and interest in and to
                your User Content. We do not claim ownership of any User Content
                you create, upload, or submit through the Service. Nothing in
                these Terms grants us any rights to your User Content beyond the
                limited license described below.
              </p>

              <p className="mb-4 font-medium text-foreground mt-6">
                6.2 License to User Content
              </p>
              <p className="mb-4">
                By uploading, submitting, or creating User Content on the
                Service, you grant us a worldwide, non-exclusive, royalty-free,
                sublicensable, and transferable license to use, reproduce,
                distribute, prepare derivative works of, display, and perform
                your User Content solely for the purpose of:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  Providing, operating, maintaining, and improving the Service.
                </li>
                <li>
                  Storing, syncing, and backing up your User Content across
                  devices.
                </li>
                <li>
                  Generating spaced repetition schedules, analytics, and
                  learning insights.
                </li>
                <li>
                  Complying with legal obligations and enforcing these Terms.
                </li>
              </ul>
              <p className="mb-4">
                This license terminates when you delete your User Content or
                Account, except that: (a) deletion may not be immediate due to
                technical limitations or backup retention periods; and (b) we
                may retain copies as required by law or for legitimate business
                purposes.
              </p>

              <p className="mb-4 font-medium text-foreground mt-6">
                6.3 Content Restrictions
              </p>
              <p className="mb-4">
                You represent and warrant that your User Content does not and
                will not: (a) infringe, violate, or misappropriate any
                third-party Intellectual Property Rights, privacy rights, or
                publicity rights; (b) contain viruses, malware, ransomware, or
                other harmful code; (c) be defamatory, obscene, pornographic,
                threatening, harassing, abusive, hateful, or discriminatory; (d)
                promote illegal activities, violence, or self-harm; (e)
                impersonate any person or entity; or (f) violate any applicable
                law or regulation.
              </p>

              <p className="mb-4 font-medium text-foreground mt-6">
                6.4 Backup Responsibility
              </p>
              <p className="mb-4">
                YOU ARE SOLELY RESPONSIBLE FOR MAINTAINING BACKUPS OF YOUR USER
                CONTENT. While we implement backup systems for operational
                purposes, we do not guarantee the availability, integrity, or
                recovery of your User Content in all circumstances. You should
                regularly export and back up your important learning materials.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                7. Intellectual Property Rights
              </h2>
              <p className="mb-4 font-medium text-foreground">
                7.1 Service Ownership
              </p>
              <p className="mb-4">
                The Service, including all software, algorithms, interfaces,
                designs, text, graphics, logos, trademarks, service marks, and
                all other Content (excluding User Content), is owned by us or
                our licensors and is protected by United States and
                international copyright, trademark, patent, trade secret, and
                other Intellectual Property Rights laws. These Terms do not
                grant you any rights to use our trademarks, service marks,
                logos, or other brand features without our prior written
                consent.
              </p>

              <p className="mb-4 font-medium text-foreground mt-6">
                7.2 Feedback
              </p>
              <p className="mb-4">
                If you provide us with any feedback, suggestions, ideas, or
                proposals regarding the Service (&quot;Feedback&quot;), you
                hereby assign to us all rights, title, and interest in and to
                such Feedback. We may use Feedback for any purpose without
                restriction, compensation, or attribution to you. Feedback is
                provided &quot;as is&quot; without warranty of any kind.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                8. Acceptable Use Policy
              </h2>
              <p className="mb-4">
                You agree to use the Service only for lawful purposes and in
                accordance with these Terms. Specifically, you agree not to use
                the Service to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  Violate any applicable federal, state, local, or international
                  law or regulation, including those concerning data privacy,
                  intellectual property, and export control.
                </li>
                <li>
                  Exploit, harm, or attempt to exploit or harm minors in any
                  way, including by exposing them to inappropriate content or
                  soliciting personally identifiable information.
                </li>
                <li>
                  Transmit, or procure the sending of, any advertising or
                  promotional material, including &quot;junk mail,&quot;
                  &quot;chain letters,&quot; &quot;spam,&quot; or any other
                  similar solicitation.
                </li>
                <li>
                  Impersonate or attempt to impersonate Temar, a Temar employee,
                  another user, or any other person or entity.
                </li>
                <li>
                  Engage in any conduct that restricts or inhibits anyone&apos;s
                  use or enjoyment of the Service, or which may harm us or users
                  of the Service, or expose them to liability.
                </li>
                <li>
                  Use the Service in any manner that could disable, overburden,
                  damage, or impair the Service or interfere with any other
                  party&apos;s use of the Service.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                9. Termination and Suspension
              </h2>
              <p className="mb-4 font-medium text-foreground">
                9.1 Termination by You
              </p>
              <p className="mb-4">
                You may terminate your Account at any time by following the
                account deletion process in your Account settings or by
                contacting us. Upon termination, your access to the Service will
                immediately cease, and we will delete or archive your User
                Content in accordance with our data retention policies.
              </p>

              <p className="mb-4 font-medium text-foreground mt-6">
                9.2 Termination by Us
              </p>
              <p className="mb-4">
                We may, in our sole discretion and without prior notice or
                liability, suspend or terminate your Account and access to the
                Service if: (a) you breach any provision of these Terms; (b) we
                are required to do so by law or regulatory authority; (c) your
                conduct creates risk or legal exposure for us; (d) you fail to
                pay applicable fees; or (e) we decide to discontinue the
                Service. We reserve the right to determine what constitutes a
                violation of these Terms in our reasonable judgment.
              </p>

              <p className="mb-4 font-medium text-foreground mt-6">
                9.3 Effect of Termination
              </p>
              <p className="mb-4">
                Upon termination of your Account: (a) your license to use the
                Service immediately terminates; (b) you must immediately cease
                all use of the Service; (c) we may delete your Account and User
                Content; (d) all provisions of these Terms that by their nature
                should survive termination shall survive, including Sections 6.2
                (License to User Content), 7 (Intellectual Property), 10
                (Disclaimer), 11 (Limitation of Liability), 12
                (Indemnification), 13 (Dispute Resolution), and 15 (General
                Provisions).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                10. Disclaimer of Warranties
              </h2>
              <p className="mb-4 uppercase">
                THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS
                AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER
                EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED
                WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
                NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
              </p>
              <p className="mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, WE EXPRESSLY
                DISCLAIM ALL WARRANTIES, WHETHER WRITTEN OR ORAL, EXPRESS OR
                IMPLIED, INCLUDING BUT NOT LIMITED TO: (A) WARRANTIES OF TITLE,
                NON-INFRINGEMENT, MERCHANTABILITY, AND FITNESS FOR A PARTICULAR
                PURPOSE; (B) WARRANTIES THAT THE SERVICE WILL BE UNINTERRUPTED,
                TIMELY, SECURE, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL
                COMPONENTS; (C) WARRANTIES THAT THE RESULTS OBTAINED FROM THE
                USE OF THE SERVICE WILL BE ACCURATE, RELIABLE, COMPLETE, OR
                SUITABLE FOR YOUR PURPOSES; (D) WARRANTIES REGARDING THE
                SECURITY, RELIABILITY, OR AVAILABILITY OF YOUR USER CONTENT; AND
                (E) WARRANTIES THAT DEFECTS IN THE SERVICE WILL BE CORRECTED.
              </p>
              <p className="mb-4">
                WE DO NOT WARRANT, ENDORSE, GUARANTEE, OR ASSUME RESPONSIBILITY
                FOR ANY PRODUCT OR SERVICE ADVERTISED OR OFFERED BY A THIRD
                PARTY THROUGH THE SERVICE, AND WE WILL NOT BE A PARTY TO OR IN
                ANY WAY BE RESPONSIBLE FOR MONITORING ANY TRANSACTION BETWEEN
                YOU AND THIRD-PARTY PROVIDERS OF PRODUCTS OR SERVICES.
              </p>
              <p className="mb-4">
                YOUR USE OF THE SERVICE IS AT YOUR SOLE RISK. NO ADVICE OR
                INFORMATION, WHETHER ORAL OR WRITTEN, OBTAINED FROM US OR
                THROUGH THE SERVICE SHALL CREATE ANY WARRANTY NOT EXPRESSLY MADE
                HEREIN.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                11. Limitation of Liability
              </h2>
              <p className="mb-4 font-medium text-foreground">
                11.1 Liability Cap
              </p>
              <p className="mb-4 uppercase">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT
                SHALL WE, OUR DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS,
                OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT
                LIMITED TO DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR
                OTHER INTANGIBLE LOSSES, EVEN IF WE HAVE BEEN ADVISED OF THE
                POSSIBILITY OF SUCH DAMAGES.
              </p>
              <p className="mb-4">
                TO THE FULLEST EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY TO
                YOU FOR ANY CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS,
                THE SERVICE, OR YOUR USE OF THE SERVICE SHALL NOT EXCEED THE
                GREATER OF: (A) THE TOTAL AMOUNT YOU PAID TO US IN THE TWELVE
                (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO
                LIABILITY; OR (B) ONE HUNDRED UNITED STATES DOLLARS ($100.00).
              </p>

              <p className="mb-4 font-medium text-foreground mt-6">
                11.2 Exclusion of Damages
              </p>
              <p className="mb-4">
                WITHOUT LIMITING THE FOREGOING, WE SHALL NOT BE LIABLE FOR: (A)
                ANY ERRORS, MISTAKES, OR INACCURACIES OF CONTENT; (B) PERSONAL
                INJURY, PROPERTY DAMAGE, OR ANY OTHER DAMAGES RESULTING FROM
                YOUR ACCESS TO OR USE OF THE SERVICE; (C) ANY UNAUTHORIZED
                ACCESS TO OR USE OF OUR SERVERS AND/OR ANY PERSONAL INFORMATION
                STORED THEREIN; (D) ANY INTERRUPTION OR CESSATION OF
                TRANSMISSION TO OR FROM THE SERVICE; (E) ANY BUGS, VIRUSES,
                TROJAN HORSES, OR THE LIKE THAT MAY BE TRANSMITTED TO OR THROUGH
                THE SERVICE BY ANY THIRD PARTY; (F) ANY LOSS OR CORRUPTION OF
                YOUR USER CONTENT; OR (G) ANY DEFAMATORY, OFFENSIVE, OR ILLEGAL
                CONDUCT OF ANY THIRD PARTY.
              </p>

              <p className="mb-4 font-medium text-foreground mt-6">
                11.3 Exceptions
              </p>
              <p className="mb-4">
                THE FOREGOING LIMITATIONS OF LIABILITY SHALL NOT APPLY TO THE
                EXTENT PROHIBITED BY APPLICABLE LAW. NOTHING IN THESE TERMS
                EXCLUDES OR LIMITS OUR LIABILITY FOR: (A) DEATH OR PERSONAL
                INJURY CAUSED BY OUR NEGLIGENCE; (B) FRAUD OR FRAUDULENT
                MISREPRESENTATION; (C) ANY OTHER LIABILITY THAT CANNOT BE
                EXCLUDED OR LIMITED UNDER APPLICABLE LAW; OR (D) CRIMINAL
                ACTIVITY COMMITTED BY US OR OUR AUTHORIZED REPRESENTATIVES.
                THESE LIMITATIONS SHALL APPLY REGARDLESS OF WHETHER LIABILITY
                ARISES FROM CONTRACT, WARRANTY, TORT (INCLUDING NEGLIGENCE),
                STRICT LIABILITY, OR ANY OTHER LEGAL THEORY.
              </p>

              <p className="mb-4 font-medium text-foreground mt-6">
                11.4 Basis of the Bargain
              </p>
              <p className="mb-4">
                YOU ACKNOWLEDGE AND AGREE THAT THE LIMITATIONS OF LIABILITY SET
                FORTH IN THIS SECTION 11 ARE FUNDAMENTAL ELEMENTS OF THE BASIS
                OF THE BARGAIN BETWEEN YOU AND US, AND THAT WE WOULD NOT PROVIDE
                THE SERVICE WITHOUT SUCH LIMITATIONS. THE PRICING AND NATURE OF
                THE SERVICE REFLECT THIS ALLOCATION OF RISK AND THE EXCLUSION OF
                CONSEQUENTIAL DAMAGES IN THIS SECTION.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                12. Indemnification
              </h2>
              <p className="mb-4">
                You agree to defend, indemnify, and hold harmless Temar, our
                parent company, subsidiaries, affiliates, officers, directors,
                employees, agents, licensors, and suppliers from and against any
                and all claims, damages, obligations, losses, liabilities,
                costs, debts, and expenses (including but not limited to
                attorney&apos;s fees) arising from or relating to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Your access to and use of the Service.</li>
                <li>
                  Your User Content and any content you submit, post, or
                  transmit through the Service.
                </li>
                <li>Your violation of any provision of these Terms.</li>
                <li>
                  Your violation of any third-party right, including without
                  limitation any Intellectual Property Rights, privacy rights,
                  or contractual rights.
                </li>
                <li>
                  Your violation of any applicable law, statute, ordinance,
                  regulation, or treaty.
                </li>
                <li>
                  Any willful misconduct, fraud, or criminal activity you engage
                  in through or in connection with the Service.
                </li>
              </ul>
              <p className="mb-4">
                This indemnification obligation will survive the termination of
                your Account and these Terms. We reserve the right to assume the
                exclusive defense and control of any matter subject to
                indemnification by you, in which case you agree to cooperate
                with us in asserting any available defenses.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                13. Dispute Resolution and Governing Law
              </h2>
              <p className="mb-4 font-medium text-foreground">
                13.1 Governing Law
              </p>
              <p className="mb-4">
                These Terms and any dispute arising out of or relating to these
                Terms, the Service, or your use of the Service shall be governed
                by and construed in accordance with the laws of the State of
                Delaware, United States of America, without regard to its
                conflict of law provisions. The United Nations Convention on
                Contracts for the International Sale of Goods shall not apply to
                these Terms.
              </p>

              <p className="mb-4 font-medium text-foreground mt-6">
                13.2 Informal Dispute Resolution
              </p>
              <p className="mb-4">
                Before filing any claim against us, you agree to try to resolve
                the dispute informally by contacting us at legal@temar.app.
                We&apos;ll try to resolve the dispute informally by contacting
                you via email. If a dispute is not resolved within 30 days of
                submission, either party may bring a formal proceeding.
              </p>

              <p className="mb-4 font-medium text-foreground mt-6">
                13.3 Arbitration Agreement
              </p>
              <p className="mb-4">
                YOU AND WE AGREE THAT ANY DISPUTE, CONTROVERSY, OR CLAIM ARISING
                OUT OF OR RELATING TO THESE TERMS, THE SERVICE, OR YOUR
                RELATIONSHIP WITH US SHALL BE RESOLVED EXCLUSIVELY THROUGH FINAL
                AND BINDING INDIVIDUAL ARBITRATION, RATHER THAN IN COURT, except
                that: (a) you may assert claims in small claims court if your
                claims qualify; and (b) you or we may seek injunctive or other
                equitable relief in a court of competent jurisdiction to prevent
                the actual or threatened infringement, misappropriation, or
                violation of a party&apos;s copyrights, trademarks, trade
                secrets, patents, or other Intellectual Property Rights.
              </p>
              <p className="mb-4">
                The arbitration shall be conducted by the American Arbitration
                Association (&quot;AAA&quot;) under its Commercial Arbitration
                Rules and Mediation Procedures. The arbitration shall be held in
                Wilmington, Delaware, or at another mutually agreed location.
                The arbitrator&apos;s decision shall be final and binding, and
                judgment on the award rendered by the arbitrator may be entered
                in any court having jurisdiction thereof.
              </p>

              <p className="mb-4 font-medium text-foreground mt-6">
                13.4 Class Action Waiver
              </p>
              <p className="mb-4">
                YOU AND WE AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER
                ONLY IN YOUR OR OUR INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF
                OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE
                PROCEEDING. FURTHER, UNLESS BOTH YOU AND WE AGREE OTHERWISE, THE
                ARBITRATOR MAY NOT CONSOLIDATE MORE THAN ONE PERSON&apos;S
                CLAIMS, AND MAY NOT OTHERWISE PRESIDE OVER ANY FORM OF A
                REPRESENTATIVE OR CLASS PROCEEDING. IF THIS SPECIFIC PARAGRAPH
                IS FOUND TO BE UNENFORCEABLE, THEN THE ENTIRETY OF THIS SECTION
                13 SHALL BE NULL AND VOID.
              </p>

              <p className="mb-4 font-medium text-foreground mt-6">
                13.5 Time Limitation on Claims
              </p>
              <p className="mb-4">
                You agree that regardless of any statute or law to the contrary,
                any claim or cause of action arising out of or related to your
                use of the Service or these Terms must be filed within one (1)
                year after such claim or cause of action arose or be forever
                barred.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                14. DMCA Copyright Policy
              </h2>
              <p className="mb-4">
                We respect the Intellectual Property Rights of others and comply
                with the Digital Millennium Copyright Act (&quot;DMCA&quot;). If
                you believe that any User Content or other material on the
                Service infringes your copyright, you may submit a notification
                pursuant to the DMCA by providing our designated Copyright Agent
                with the following information in writing:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  A physical or electronic signature of a person authorized to
                  act on behalf of the owner of an exclusive right that is
                  allegedly infringed.
                </li>
                <li>
                  Identification of the copyrighted work claimed to have been
                  infringed, or, if multiple copyrighted works are covered by a
                  single notification, a representative list of such works.
                </li>
                <li>
                  Identification of the material that is claimed to be
                  infringing or to be the subject of infringing activity and
                  that is to be removed or access to which is to be disabled,
                  and information reasonably sufficient to permit us to locate
                  the material.
                </li>
                <li>
                  Information reasonably sufficient to permit us to contact you,
                  such as an address, telephone number, and, if available, an
                  email address.
                </li>
                <li>
                  A statement that you have a good faith belief that use of the
                  material in the manner complained of is not authorized by the
                  copyright owner, its agent, or the law.
                </li>
                <li>
                  A statement that the information in the notification is
                  accurate, and under penalty of perjury, that you are
                  authorized to act on behalf of the owner of an exclusive right
                  that is allegedly infringed.
                </li>
              </ul>
              <p className="mb-4">
                Our designated Copyright Agent for notice of alleged copyright
                infringement can be reached at: copyright@temar.app.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                15. General Provisions
              </h2>
              <p className="mb-4 font-medium text-foreground">
                15.1 Entire Agreement
              </p>
              <p className="mb-4">
                These Terms, together with our Privacy Policy and any other
                legal notices published by us on the Service, constitute the
                entire agreement between you and us concerning the Service and
                supersede and replace any prior agreements, communications, and
                proposals, whether oral or written, between you and us.
              </p>

              <p className="mb-4 font-medium text-foreground mt-6">
                15.2 Severability
              </p>
              <p className="mb-4">
                If any provision of these Terms is held to be invalid, illegal,
                or unenforceable for any reason, such provision shall be
                modified to the minimum extent necessary to make it valid,
                legal, and enforceable while preserving its intent, or if such
                modification is not possible, such provision shall be severed
                from these Terms. The remaining provisions shall continue in
                full force and effect.
              </p>

              <p className="mb-4 font-medium text-foreground mt-6">
                15.3 Waiver
              </p>
              <p className="mb-4">
                No waiver of any term of these Terms shall be deemed a further
                or continuing waiver of such term or any other term, and our
                failure to assert any right or provision under these Terms shall
                not constitute a waiver of such right or provision.
              </p>

              <p className="mb-4 font-medium text-foreground mt-6">
                15.4 Assignment
              </p>
              <p className="mb-4">
                You may not assign or transfer these Terms, by operation of law
                or otherwise, without our prior written consent. Any attempt by
                you to assign or transfer these Terms without such consent will
                be null and void. We may freely assign or transfer these Terms
                without restriction. Subject to the foregoing, these Terms will
                bind and inure to the benefit of the parties, their successors,
                and permitted assigns.
              </p>

              <p className="mb-4 font-medium text-foreground mt-6">
                15.5 Force Majeure
              </p>
              <p className="mb-4">
                We shall not be liable for any failure or delay in performing
                our obligations under these Terms where such failure or delay
                results from any cause beyond our reasonable control, including
                but not limited to mechanical, electronic, or communications
                failure or degradation, acts of God, terrorism, war, natural
                disasters, failure of common carriers, power outages, or
                governmental restrictions.
              </p>

              <p className="mb-4 font-medium text-foreground mt-6">
                15.6 Notices
              </p>
              <p className="mb-4">
                We may provide notices to you by posting them on the Service,
                sending them to your registered email address, or through other
                reasonable means. You may provide notices to us by email to
                legal@temar.app or by physical mail to our registered business
                address.
              </p>

              <p className="mb-4 font-medium text-foreground mt-6">
                15.7 Export Compliance
              </p>
              <p className="mb-4">
                You represent and warrant that you are not: (a) located in any
                country subject to U.S. Government embargo or designated as a
                &quot;terrorist supporting&quot; country; (b) listed on any U.S.
                Government list of prohibited or restricted parties; or (c)
                prohibited from receiving U.S. origin products under any
                applicable export control laws. You agree to comply with all
                applicable export and re-export control laws and regulations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                16. Changes to Terms
              </h2>
              <p className="mb-4">
                We reserve the right, in our sole discretion, to modify or
                replace these Terms at any time. If a revision is material, we
                will provide at least 30 days&apos; notice prior to any new
                terms taking effect, by posting the changes on the Service or by
                sending you an email notification. What constitutes a material
                change will be determined at our sole discretion.
              </p>
              <p className="mb-4">
                By continuing to access or use the Service after any revisions
                become effective, you agree to be bound by the revised Terms. If
                you do not agree to the new Terms, you must stop using the
                Service immediately. You are advised to review these Terms
                periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                17. Electronic Communications
              </h2>
              <p className="mb-4">
                By using the Service, you consent to receive electronic
                communications from us, including emails, push notifications,
                and messages posted to your Account. You agree that all
                agreements, notices, disclosures, and other communications that
                we provide to you electronically satisfy any legal requirement
                that such communications be in writing.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                18. Contact Information
              </h2>
              <p className="mb-4">
                If you have any questions, concerns, or comments about these
                Terms or the Service, please contact us at:
              </p>
              <p className="font-medium text-foreground mb-2">
                Email: legal@temar.app
                <br />
                Support: support@temar.app
                <br />
                Address: Temar Legal Department
                <br />
                [Your Business Address]
                <br />
                United States
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
