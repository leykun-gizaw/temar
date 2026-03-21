import Image from 'next/image';
import Link from 'next/link';
import heroImg from '@/assets/hero_img.png';
import {
  CalendarCheck,
  BrainCircuit,
  ArrowRight,
  Sparkles,
  Layers3,
  MessageSquareText,
  RotateCcw,
  TrendingUp,
  BookOpen,
  Zap,
  Target,
  BarChart3,
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

        {/* Feature Bento */}
        <section className="mb-28">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Spaced Repetition — wide */}
            <div className="md:col-span-2 bg-muted/40 p-10 rounded-[2.5rem] shadow-md flex flex-col justify-between min-h-[320px]">
              <div>
                <CalendarCheck className="w-10 h-10 text-primary mb-6" />
                <h3 className="text-2xl font-bold mb-4">Spaced Repetition</h3>
                <p className="text-muted-foreground leading-relaxed max-w-md">
                  Our algorithms predict exactly when you&apos;re about to
                  forget a concept, prompting a review at the optimal moment to
                  strengthen neural pathways.
                </p>
              </div>
              <div className="mt-8 flex gap-2 opacity-40">
                <div className="h-12 w-32 bg-muted rounded-xl" />
                <div className="h-12 w-48 bg-muted rounded-xl" />
                <div className="h-12 w-24 bg-muted rounded-xl" />
              </div>
            </div>

            {/* Active Recall — narrow */}
            <div className="bg-secondary p-10 rounded-[2.5rem] shadow-md flex flex-col justify-between">
              <div>
                <BrainCircuit className="w-10 h-10 text-secondary-foreground mb-6" />
                <h3 className="text-2xl font-bold text-secondary-foreground mb-4">
                  Active Recall
                </h3>
                <p className="text-secondary-foreground/80 leading-relaxed">
                  Don&apos;t just re-read. Test your brain. Our system converts
                  your notes into dynamic prompts for deeper learning.
                </p>
              </div>
              <div className="mt-8 flex justify-end">
                <Sparkles className="w-16 h-16 text-secondary-foreground/15" />
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mb-28">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
              How Temar works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Three simple steps from raw notes to long-term mastery.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-muted/40 rounded-[2rem] p-8 shadow-md text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Layers3 className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-3">Organize into Chunks</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Break your knowledge into Topics, Notes, and bite-sized Chunks.
                Our rich editor supports markdown, code blocks, and diagrams.
              </p>
            </div>

            <div className="bg-muted/40 rounded-[2rem] p-8 shadow-md text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MessageSquareText className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-3">Generate Questions</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI reads your chunks and generates targeted questions with
                rubrics — multiple choice, short answer, and more.
              </p>
            </div>

            <div className="bg-muted/40 rounded-[2rem] p-8 shadow-md text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <RotateCcw className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-3">Review & Master</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                FSRS scheduling surfaces the right questions at the right time.
                AI analyzes your answers and adapts difficulty automatically.
              </p>
            </div>
          </div>
        </section>

        {/* Built on science */}
        <section className="mb-28">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
              Built on proven learning science
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Every feature is grounded in cognitive science research.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: BrainCircuit,
                title: 'Active Recall',
                desc: 'Testing yourself strengthens memory far more than passive review.',
              },
              {
                icon: CalendarCheck,
                title: 'Spaced Repetition',
                desc: 'Review at scientifically optimal intervals to maximize retention.',
              },
              {
                icon: TrendingUp,
                title: 'Adaptive Difficulty',
                desc: 'AI adjusts question complexity based on your performance history.',
              },
              {
                icon: BarChart3,
                title: 'Progress Tracking',
                desc: 'Detailed analytics show your mastery level across every topic.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-muted/40 rounded-[2rem] p-7 shadow-md hover:-translate-y-1 transition-transform"
              >
                <f.icon className="w-8 h-8 text-primary mb-5" />
                <h4 className="font-bold mb-2">{f.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Everything you need */}
        <section className="mb-28">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
              Everything you need to guarantee retention
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: BookOpen,
                title: 'Rich Content Editor',
                desc: 'Markdown, code blocks, LaTeX, and Mermaid diagrams in one editor.',
              },
              {
                icon: Zap,
                title: 'AI Question Generation',
                desc: 'Automatically generate diverse question types from your study material.',
              },
              {
                icon: Target,
                title: 'Semantic Answer Analysis',
                desc: 'AI evaluates your answers for understanding, not just keyword matching.',
              },
              {
                icon: Layers3,
                title: 'Hierarchical Organization',
                desc: 'Topics, Notes, and Chunks keep your knowledge structured and navigable.',
              },
              {
                icon: TrendingUp,
                title: 'FSRS Scheduling',
                desc: 'State-of-the-art algorithm optimizes review timing for each concept.',
              },
              {
                icon: Sparkles,
                title: 'Bring Your Own Key',
                desc: 'Use your own API keys for free AI access, or use our built-in Pass system.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="flex items-start gap-4 p-5 rounded-2xl hover:bg-muted/40 transition-colors"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">{f.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming Reviews (Visual Shell) */}
        <section className="mb-28">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2">Upcoming Reviews</h2>
              <p className="text-muted-foreground">
                Based on your memory performance index.
              </p>
            </div>
            <Link
              href="/dashboard/reviews"
              className="text-sm text-primary font-bold flex items-center gap-2 hover:underline group"
            >
              View Schedule{' '}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                topic: 'History',
                cards: 14,
                name: 'The Renaissance Era',
                mastery: 85,
                due: 'Due Today',
                cta: 'Start Session',
              },
              {
                topic: 'Science',
                cards: 32,
                name: 'Molecular Biology',
                mastery: 42,
                due: 'In 4 Hours',
                cta: 'Preview Deck',
              },
              {
                topic: 'Language',
                cards: 105,
                name: 'Advanced Japanese Kanji',
                mastery: 92,
                due: 'Tomorrow',
                cta: 'View Analytics',
              },
            ].map((item) => (
              <div
                key={item.name}
                className="bg-card p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4"
              >
                <div className="flex justify-between items-start">
                  <span className="bg-muted px-3 py-1 rounded-full text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider">
                    {item.topic} &middot; {item.cards} Cards
                  </span>
                  <span className="text-[0.65rem] font-bold text-primary uppercase tracking-wider">
                    {item.due}
                  </span>
                </div>
                <h3 className="text-lg font-bold">{item.name}</h3>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full"
                      style={{ width: `${item.mastery}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-bold">
                    {item.mastery}% Mastery
                  </span>
                </div>
                <button className="w-full py-3 mt-2 bg-muted hover:bg-primary hover:text-primary-foreground transition-colors rounded-xl font-bold text-sm">
                  {item.cta}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold mb-6">
            <Sparkles className="w-4 h-4" />
            Free to start
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
            Stop reviewing notes.
            <br />
            Start mastering them.
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Join self-directed learners who use Temar to organize their
            knowledge and guarantee long-term retention.
          </p>
          <Link
            href="/dashboard"
            className="px-10 py-4 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-lg rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] transition-all inline-flex items-center gap-2"
          >
            Start Learning Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
