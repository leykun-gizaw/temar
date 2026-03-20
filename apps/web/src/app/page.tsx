import Link from 'next/link';
import {
  CalendarCheck,
  BrainCircuit,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import SiteNavbar from '@/components/site-navbar';
import SiteFooter from '@/components/site-footer';

export default function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      <SiteNavbar />

      {/* Hero */}
      <header className="relative w-full min-h-[85vh] flex items-center overflow-hidden">
        {/* Soft amber glow */}
        <div className="absolute right-1/4 top-1/3 w-[500px] h-[500px] bg-primary/6 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <div className="max-w-xl">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.08] mb-6">
              Your space for
              <br />
              <span className="text-secondary-foreground">deep cognition</span>.
            </h1>
            <p className="text-base text-muted-foreground max-w-lg leading-relaxed mb-10">
              A sanctuary designed to automate your learning. We leverage spaced
              repetition and active recall to ensure your knowledge doesn&apos;t
              just pass through, but stays.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-primary rounded-xl text-primary-foreground font-semibold hover:bg-primary/90 hover:scale-[1.02] transition-all duration-200 flex items-center gap-2 shadow-md shadow-primary/15"
              >
                Start Learning
              </Link>
              <Link
                href="/dashboard/materials"
                className="px-6 py-3 bg-background border border-border text-foreground font-semibold rounded-xl hover:bg-muted transition-colors"
              >
                Capture Note
              </Link>
            </div>
          </div>

          {/* Right: Illustration placeholder + floating card */}
          <div className="relative hidden lg:block">
            <div className="w-full aspect-[4/3] rounded-3xl bg-gradient-to-br from-secondary to-secondary/40 flex items-end justify-center overflow-hidden">
              <div className="w-3/4 h-2/3 bg-accent/60 rounded-t-xl" />
            </div>
            {/* Floating Active Recall card */}
            <div className="absolute -bottom-4 -left-6 bg-card border border-border rounded-xl p-4 shadow-lg max-w-[220px]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Active Recall
                </span>
              </div>
              <p className="text-sm font-medium leading-snug">
                &ldquo;What is the Ebbinghaus Forgetting Curve?&rdquo;
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Feature Cards */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="group bg-card p-8 border border-border rounded-2xl hover:-translate-y-1 hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 bg-accent-orange-bg rounded-xl flex items-center justify-center mb-6">
              <CalendarCheck className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Spaced Repetition</h3>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Our algorithms predict exactly when you&apos;re about to forget a
              concept, prompting a review at the optimal moment to strengthen
              neural pathways.
            </p>
          </div>

          <div className="group bg-secondary/50 p-8 border border-secondary rounded-2xl hover:-translate-y-1 hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mb-6">
              <BrainCircuit className="w-6 h-6 text-secondary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-3">Active Recall</h3>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Don&apos;t just re-read. Test your brain. Our system converts your
              notes into dynamic prompts for deeper learning.
            </p>
          </div>
        </div>
      </section>

      {/* Upcoming Reviews (Visual Shell) */}
      <section className="py-16 px-6 max-w-7xl mx-auto border-t border-border">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Upcoming Reviews</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Based on your memory performance index.
            </p>
          </div>
          <Link
            href="/dashboard/reviews"
            className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
          >
            View Schedule <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              topic: 'History',
              cards: 14,
              name: 'The Renaissance Era',
              mastery: 81,
              cta: 'Start Session',
            },
            {
              topic: 'Science',
              cards: 21,
              name: 'Molecular Biology',
              mastery: 67,
              cta: 'Preview Deck',
            },
            {
              topic: 'Language',
              cards: 165,
              name: 'Advanced Japanese Kanji',
              mastery: 92,
              cta: 'View Analytics',
            },
          ].map((item) => (
            <div
              key={item.name}
              className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="uppercase font-semibold tracking-wider">
                  {item.topic}
                </span>
                <span className="text-border">•</span>
                <span>{item.cards} cards</span>
              </div>
              <h3 className="text-lg font-bold">{item.name}</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${item.mastery}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {item.mastery}% Mastery
                </span>
              </div>
              <button className="w-full py-2.5 text-sm font-semibold border border-border rounded-lg hover:bg-muted transition-colors">
                {item.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Free to start</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
          Stop reviewing notes.
          <br />
          Start mastering them.
        </h2>
        <p className="text-base text-muted-foreground mb-10 max-w-xl mx-auto">
          Join self-directed learners who use Temar to organize their knowledge
          and guarantee long-term retention.
        </p>
        <Link
          href="/dashboard"
          className="px-10 py-4 bg-primary text-primary-foreground font-bold text-lg rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25 hover:scale-[1.02] transition-all duration-200 inline-flex items-center gap-2"
        >
          Start Learning Free
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}
