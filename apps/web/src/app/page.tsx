import Image from 'next/image';
import Link from 'next/link';
import heroImg from '@/assets/hero_img.png';
import {
  CalendarCheck,
  BrainCircuit,
  ArrowRight,
  Sparkles,
  Layers3,

  RotateCcw,
  TrendingUp,
  BookOpen,
  Zap,
  Target,
  BarChart3,
  CheckCircle2,
  Users,
  Star,
  Shield,
  Clock,
  FileText,
  Check,
} from 'lucide-react';
import SiteNavbar from '@/components/site-navbar';
import SiteFooter from '@/components/site-footer';

export default function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      <SiteNavbar />

      <main className="max-w-7xl mx-auto px-6 pt-28 pb-32">
        {/* Hero */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-28">
          <div className="lg:col-span-7">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.08] mb-6">
              Master your
              <br />
              learning with{' '}
              <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                Temar
              </span>
              .
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl leading-relaxed mb-10">
              A sanctuary designed to automate your learning. We leverage spaced
              repetition and active recall to ensure your knowledge doesn&apos;t
              just pass through, but stays.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95"
              >
                Get Started
              </Link>
              <Link
                href="/dashboard/materials"
                className="px-8 py-4 bg-secondary text-secondary-foreground rounded-full font-bold hover:bg-secondary/80 transition-all active:scale-95"
              >
                Capture Note
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 relative hidden lg:block">
            <div className="aspect-square rounded-[3rem] overflow-hidden relative">
              <Image
                src={heroImg}
                alt="Peaceful desk with a lamp, books, and plant"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
            </div>

            {/* Floating Active Recall card */}
            <div className="absolute -bottom-6 -left-6 bg-card/80 backdrop-blur-2xl p-5 rounded-xl shadow-2xl border border-border/30 max-w-[260px]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">
                  Active Recall
                </span>
              </div>
              <p className="text-sm font-semibold leading-snug">
                &ldquo;What is the Ebbinghaus Forgetting Curve?&rdquo;
              </p>
              <div className="mt-3">
                <span className="text-[0.65rem] bg-secondary text-secondary-foreground px-2 py-1 rounded font-medium">
                  High Retention
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats / Trust Bar ── */}
        <section className="mb-28">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                icon: Zap,
                value: '10,000+',
                label: 'Questions Generated',
              },
              {
                icon: TrendingUp,
                value: '98%',
                label: 'Retention Rate',
              },
              {
                icon: BrainCircuit,
                value: '50+',
                label: 'AI Models Supported',
              },
              {
                icon: Users,
                value: '5,000+',
                label: 'Active Learners',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-card rounded-[2rem] p-8 text-center hover:-translate-y-1 transition-transform"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-3xl font-extrabold tracking-tight mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Experience Learning Like Never Before ── */}
        <section className="mb-28">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
              Experience Learning Like Never Before
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Powerful tools designed to transform how you study and retain
              knowledge.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Card 1 — Review Session */}
            <div className="bg-card rounded-[2.5rem] p-10 flex flex-col justify-between min-h-[380px] group">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6">
                  <BrainCircuit className="w-3.5 h-3.5" />
                  AI-Powered Review
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  Smart Review Sessions
                </h3>
                <p className="text-muted-foreground leading-relaxed max-w-sm">
                  AI generates targeted questions from your notes and evaluates
                  your answers semantically — not just keyword matching.
                </p>
              </div>
              {/* Visual mockup */}
              <div className="mt-8 bg-muted/60 rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Review Session
                  </span>
                </div>
                <div className="bg-background rounded-xl p-4">
                  <p className="text-sm font-semibold mb-2">
                    &ldquo;Explain the Ebbinghaus Forgetting Curve and its
                    implications.&rdquo;
                  </p>
                  <div className="flex gap-2 mt-3">
                    <span className="text-[0.65rem] bg-secondary text-secondary-foreground px-2 py-1 rounded font-medium">
                      Short Answer
                    </span>
                    <span className="text-[0.65rem] bg-primary/10 text-primary px-2 py-1 rounded font-medium">
                      Due Now
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-9 flex-1 bg-background rounded-lg" />
                  <div className="h-9 w-20 bg-primary/20 rounded-lg" />
                </div>
              </div>
            </div>

            {/* Card 2 — Materials Browser */}
            <div className="bg-card rounded-[2.5rem] p-10 flex flex-col justify-between min-h-[380px] group">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold mb-6">
                  <Layers3 className="w-3.5 h-3.5" />
                  Organized Knowledge
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  Materials Browser
                </h3>
                <p className="text-muted-foreground leading-relaxed max-w-sm">
                  Organize your knowledge in a clean hierarchy of Topics, Notes,
                  and Chunks with a rich Lexical editor.
                </p>
              </div>
              {/* Visual mockup */}
              <div className="mt-8 bg-muted/60 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 rounded-full bg-secondary-foreground" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Materials
                  </span>
                </div>
                <div className="space-y-2">
                  {[
                    {
                      name: 'Cognitive Science',
                      chunks: 12,
                      color: 'bg-primary/15',
                    },
                    {
                      name: 'Machine Learning',
                      chunks: 8,
                      color: 'bg-secondary',
                    },
                    {
                      name: 'World History',
                      chunks: 24,
                      color: 'bg-accent',
                    },
                  ].map((topic) => (
                    <div
                      key={topic.name}
                      className="bg-background rounded-xl p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 ${topic.color} rounded-lg flex items-center justify-center`}
                        >
                          <BookOpen className="w-4 h-4 text-foreground/60" />
                        </div>
                        <span className="text-sm font-semibold">
                          {topic.name}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {topic.chunks} chunks
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Smart Features for Better Learning ── */}
        <section className="mb-28">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
              Smart Features for Better Learning
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Every feature is grounded in cognitive science and designed for
              results.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: CalendarCheck,
                title: 'Spaced Repetition',
                desc: 'FSRS algorithm predicts when you will forget and schedules reviews at the optimal moment.',
              },
              {
                icon: BrainCircuit,
                title: 'Active Recall',
                desc: 'AI converts your notes into dynamic prompts that test deep understanding, not surface memory.',
              },
              {
                icon: Target,
                title: 'Semantic Analysis',
                desc: 'AI evaluates your answers for conceptual understanding, providing detailed rubric-based feedback.',
              },
              {
                icon: BookOpen,
                title: 'Rich Content Editor',
                desc: 'Write with markdown, code blocks, LaTeX, and diagrams in a powerful Lexical-based editor.',
              },
              {
                icon: BarChart3,
                title: 'Detailed Analytics',
                desc: 'Track retention rates, review streaks, forgetting curves, and mastery across every topic.',
              },
              {
                icon: Shield,
                title: 'Bring Your Own Key',
                desc: 'Use your own API keys for unlimited AI access, or use our built-in Pass credit system.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-card rounded-[2rem] p-8 hover:-translate-y-1 transition-transform"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-5">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-lg font-bold mb-2">{f.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Effortless Learning Experience ── */}
        <section className="mb-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — Text */}
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
                Effortless Learning Experience
              </h2>
              <p className="text-muted-foreground text-lg mb-10 max-w-lg">
                Three simple steps from raw notes to long-term mastery. Let AI
                handle the heavy lifting.
              </p>

              <div className="space-y-8">
                {[
                  {
                    step: '01',
                    icon: FileText,
                    title: 'Capture Your Knowledge',
                    desc: 'Organize material into Topics, Notes, and bite-sized Chunks with our rich editor.',
                  },
                  {
                    step: '02',
                    icon: Sparkles,
                    title: 'Generate Questions',
                    desc: 'AI reads your chunks and creates targeted questions with rubrics automatically.',
                  },
                  {
                    step: '03',
                    icon: RotateCcw,
                    title: 'Review & Master',
                    desc: 'FSRS scheduling surfaces the right questions at the right time. Mastery is guaranteed.',
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-5">
                    <div className="shrink-0">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <item.icon className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-bold text-primary tracking-widest">
                          STEP {item.step}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Visual */}
            <div className="bg-card rounded-[2.5rem] p-8 lg:p-10">
              <div className="space-y-4">
                {/* Mini schedule mockup */}
                <div className="bg-muted/60 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Today&apos;s Schedule
                    </span>
                  </div>
                  <div className="space-y-2">
                    {[
                      {
                        name: 'Cognitive Science',
                        count: 8,
                        status: 'Due Now',
                        statusColor: 'text-primary',
                      },
                      {
                        name: 'Machine Learning',
                        count: 5,
                        status: 'In 2h',
                        statusColor: 'text-muted-foreground',
                      },
                      {
                        name: 'World History',
                        count: 12,
                        status: 'In 6h',
                        statusColor: 'text-muted-foreground',
                      },
                    ].map((item) => (
                      <div
                        key={item.name}
                        className="bg-background rounded-xl p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="text-sm font-medium">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {item.count} cards
                          </span>
                          <span
                            className={`text-xs font-bold ${item.statusColor}`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mini analytics mockup */}
                <div className="bg-muted/60 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Retention Overview
                    </span>
                  </div>
                  <div className="flex items-end gap-1.5 h-20">
                    {[40, 55, 45, 70, 60, 80, 75, 90, 85, 92, 88, 95].map(
                      (h, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-primary/20 rounded-t-md relative overflow-hidden"
                          style={{ height: `${h}%` }}
                        >
                          <div
                            className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-md"
                            style={{ height: `${Math.min(h + 10, 100)}%` }}
                          />
                        </div>
                      )
                    )}
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-[0.6rem] text-muted-foreground">
                      Jan
                    </span>
                    <span className="text-[0.6rem] text-muted-foreground">
                      Dec
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── What Our Experts Say ── */}
        <section className="mb-28">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
              What Our Experts Say
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Trusted by learners and educators who take retention seriously.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  'Temar completely changed how I study for medical exams. The FSRS scheduling means I never waste time reviewing what I already know.',
                name: 'Dr. Sarah Chen',
                role: 'Medical Resident',
                initials: 'SC',
              },
              {
                quote:
                  'The AI question generation is incredible. It creates questions that actually test understanding, not just memorization. My students love it.',
                name: 'James Okonkwo',
                role: 'University Lecturer',
                initials: 'JO',
              },
              {
                quote:
                  'I used to forget 80% of what I read within a week. With Temar, my retention rate is consistently above 90% across all my subjects.',
                name: 'Anika Patel',
                role: 'Graduate Student',
                initials: 'AP',
              },
            ].map((t) => (
              <div
                key={t.name}
                className="bg-card rounded-[2rem] p-8 flex flex-col justify-between"
              >
                <div>
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-primary text-primary"
                      />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/80 mb-6">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Choose Your Plan ── */}
        <section className="mb-28">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
              Choose Your Plan
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Start free and upgrade as your learning grows.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: 'Free',
                price: '0',
                desc: 'Perfect for getting started',
                features: [
                  'Up to 3 topics',
                  'Basic AI question generation',
                  'FSRS scheduling',
                  'Community support',
                ],
                cta: 'Get Started',
                highlighted: false,
              },
              {
                name: 'Pro',
                price: '12',
                desc: 'For serious learners',
                features: [
                  'Unlimited topics & notes',
                  'Advanced AI models',
                  'Semantic answer analysis',
                  'Detailed analytics',
                  'Priority support',
                  'BYOK support',
                ],
                cta: 'Start Pro Trial',
                highlighted: true,
              },
              {
                name: 'Team',
                price: '29',
                desc: 'For study groups & classes',
                features: [
                  'Everything in Pro',
                  'Shared topic libraries',
                  'Team analytics dashboard',
                  'Admin controls',
                  'Bulk import tools',
                  'Dedicated support',
                ],
                cta: 'Contact Us',
                highlighted: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-[2rem] p-8 flex flex-col ${
                  plan.highlighted
                    ? 'bg-gradient-to-b from-primary to-primary/90 text-primary-foreground ring-4 ring-primary/20 scale-[1.02]'
                    : 'bg-card'
                }`}
              >
                <h3
                  className={`text-lg font-bold mb-1 ${plan.highlighted ? '' : ''}`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`text-sm mb-6 ${plan.highlighted ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}
                >
                  {plan.desc}
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold">
                    ${plan.price}
                  </span>
                  <span
                    className={`text-sm ${plan.highlighted ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}
                  >
                    /month
                  </span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check
                        className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlighted ? 'text-primary-foreground' : 'text-primary'}`}
                      />
                      <span
                        className={
                          plan.highlighted
                            ? 'text-primary-foreground/90'
                            : 'text-foreground/80'
                        }
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.name === 'Team' ? 'mailto:support@temar.app' : '/dashboard'}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm text-center block transition-all ${
                    plan.highlighted
                      ? 'bg-white text-primary hover:bg-white/90'
                      : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── Join 5,000+ Learners — Final CTA ── */}
        <section className="text-center py-20 mb-8">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold mb-6">
              <CheckCircle2 className="w-4 h-4" />
              Free to start &middot; No credit card required
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
              Join 5,000+ Learners
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Stop reviewing notes passively. Start mastering them with
              AI-powered spaced repetition that guarantees long-term retention.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="px-10 py-4 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-lg rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] transition-all inline-flex items-center justify-center gap-2"
              >
                Start Learning Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/pricing"
                className="px-10 py-4 bg-secondary text-secondary-foreground font-bold text-lg rounded-full hover:bg-secondary/80 transition-all inline-flex items-center justify-center gap-2"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
