import Link from 'next/link';
import {
  BrainCircuit,
  CalendarCheck,
  ChevronRight,
  BarChart3,
  Layers,
  PenTool,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ListTree,
  Activity,
  BookOpenCheck,
  Target,
  Crosshair,
  Zap,
  BookOpen,
  Eye,
} from 'lucide-react';
import SiteNavbar from '@/components/site-navbar';
import SiteFooter from '@/components/site-footer';
import KnowledgeNetworkWrapper from '@/components/knowledge-network-wrapper';

export default function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      <SiteNavbar />

      {/* Hero — full-width with 3D network as background */}
      <header className="relative w-full min-h-[88vh] flex items-center overflow-hidden">
        {/* Full-bleed 3D canvas */}
        <div className="absolute inset-0">
          <KnowledgeNetworkWrapper />
        </div>
        {/* Gradient mask: opaque behind text, fades toward right so network shows */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/20 pointer-events-none" />
        {/* Soft glow accent */}
        <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/20 text-primary text-sm font-semibold mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI-powered spaced repetition</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
              Master your
              <br />
              learning with <span className="text-primary">Temar</span>
            </h1>
            <p className="text-base text-muted-foreground max-w-lg leading-relaxed mb-10">
              Organize topics, track progress, and stay consistent. Temar brings
              clarity and momentum to your self-directed study plan through
              structured notes and AI-powered active recall.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Link
                href="/dashboard"
                className="px-8 py-3.5 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 flex items-center gap-2 shadow-md shadow-primary/15"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pricing"
                className="px-8 py-3.5 bg-background/70 backdrop-blur-sm border border-border text-foreground font-semibold rounded-md hover:bg-muted transition-colors flex items-center"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Core Pillars */}
      <section className="py-14 px-6 max-w-7xl mx-auto border-t border-border">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <Layers className="w-5 h-5 text-primary" />,
              title: 'Stay Organized',
              body: 'Group and search topics effortlessly so you always know what to learn next. Build a structured hierarchy of knowledge.',
            },
            {
              icon: <Activity className="w-5 h-5 text-primary" />,
              title: 'Track Progress',
              body: 'Capture what you have covered and what remains with simple, actionable structure. Monitor retrievability and stability.',
            },
            {
              icon: <CalendarCheck className="w-5 h-5 text-primary" />,
              title: 'Stay Consistent',
              body: 'Reduce friction and context switching—focus on incremental wins every day with an automated review schedule.',
            },
          ].map((card) => (
            <div
              key={card.title}
              className="group bg-card p-8 border border-border shadow-sm rounded-xl hover:-translate-y-1 hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-default"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/15 transition-colors">
                {card.icon}
              </div>
              <h3 className="text-lg font-bold mb-3">{card.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Deep-Dives */}
      <section
        id="features"
        className="py-24 px-6 max-w-7xl mx-auto space-y-32"
      >
        {/* Feature 1: Hierarchy & Notes */}
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
              <ListTree className="w-4 h-4" />
              <span>Structured Knowledge Base</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              Organize knowledge into manageable Chunks.
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Temar uses a strict but flexible hierarchy:{' '}
              <strong>Topics</strong> &gt; <strong>Notes</strong> &gt;{' '}
              <strong>Chunks</strong>. Instead of monolithic documents, break
              your learning materials into atomic, testable units. Write rich
              text notes, code blocks, and tables to capture the essence of a
              concept.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start text-muted-foreground">
                <CheckCircle2 className="w-5 h-5 text-primary mr-3 shrink-0 mt-0.5" />
                <span>
                  Maintain clear separation between broad Topics (e.g., DS&A)
                  and specific Notes (e.g., Lists).
                </span>
              </li>
              <li className="flex items-start text-muted-foreground">
                <CheckCircle2 className="w-5 h-5 text-primary mr-3 shrink-0 mt-0.5" />
                <span>
                  Rich text editor designed for technical and academic writing.
                </span>
              </li>
            </ul>
          </div>

          {/* Mock: Hierarchy */}
          <div className="lg:w-1/2 w-full">
            <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row h-[400px]">
              <div className="w-full md:w-1/3 border-r border-border bg-muted/30 p-4">
                <div className="text-xs font-semibold text-muted-foreground mb-4 tracking-wider">
                  MATERIALS
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm font-medium">
                    <ChevronRight className="w-3 h-3 mr-1" /> DS&A
                  </div>
                  <div className="pl-4 space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground bg-card p-1.5 rounded border border-border shadow-sm">
                      <span className="text-blue-500 mr-2 text-xs">●</span>
                      ADTs & Data Structures
                    </div>
                    <div className="pl-6 space-y-1">
                      <div className="text-sm text-primary font-medium flex items-center">
                        <span className="w-1 h-1 bg-primary rounded-full mr-2" />
                        Introduction (Chunk)
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <span className="w-1 h-1 bg-muted-foreground/40 rounded-full mr-2" />
                        List (Chunk)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-2/3 p-6 bg-card overflow-hidden">
                <div className="text-xs text-muted-foreground mb-2">
                  DS&A / ADTs & Data Structures
                </div>
                <h3 className="text-xl font-bold mb-4">Introduction to ADTs</h3>
                <div className="space-y-4">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-5/6" />
                  <div className="h-4 bg-muted rounded w-4/6" />
                  <div className="mt-6 border border-border rounded-md p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="font-semibold text-sm mb-2">
                          Abstract Data Type
                        </div>
                        <div className="h-3 bg-muted/60 rounded w-full" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm mb-2">
                          Data Structure
                        </div>
                        <div className="h-3 bg-muted/60 rounded w-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: AI Generation */}
        <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
          <div className="lg:w-1/2 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-sm font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Active Recall</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              Turn notes into targeted questions instantly.
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Reading notes creates an illusion of competence. Temar bridges the
              gap between passive reading and active mastery by using AI to
              generate targeted questions directly from your chunks.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="bg-card p-2 rounded-lg border border-border shadow-sm mr-4 shrink-0">
                  <PenTool className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold">Open-ended explainers</h4>
                  <p className="text-sm text-muted-foreground">
                    Test your deep understanding by explaining concepts in your
                    own words.
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="bg-card p-2 rounded-lg border border-border shadow-sm mr-4 shrink-0">
                  <BarChart3 className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold">Algorithm / Leetcode-style</h4>
                  <p className="text-sm text-muted-foreground">
                    Generate practical coding problems based on theoretical
                    algorithms.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Mock: Generate Modal */}
          <div className="lg:w-1/2 w-full flex justify-center">
            <div className="bg-card p-8 border border-border shadow-xl rounded-xl w-full max-w-md">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-lg">
                    Configure Question Generation
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Choose question types for this chunk.
                  </p>
                </div>
                <button className="text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>
              <div className="space-y-4 mb-6">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <div className="w-5 h-5 rounded border bg-primary border-primary flex items-center justify-center mt-0.5 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">
                      Open-ended explainer
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Written explanation demonstrating understanding
                    </div>
                  </div>
                </label>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <div className="w-5 h-5 rounded border border-border mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-sm">
                      Multiple choice (MCQ)
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Choose from 4 options
                    </div>
                  </div>
                </label>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <div className="w-5 h-5 rounded border border-border mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-sm">
                      Algorithm / Leetcode-style
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Problem requiring a solution approach or code
                    </div>
                  </div>
                </label>
              </div>
              <div className="mb-8">
                <div className="text-sm font-semibold mb-2">
                  Number of Questions
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    defaultValue={3}
                    readOnly
                    className="w-16 p-2 border border-border rounded text-center bg-background"
                  />
                  <span className="text-xs text-muted-foreground">
                    Suggested: 3 (based on content length)
                  </span>
                </div>
              </div>
              <div className="flex justify-end space-x-3 border-t border-border pt-4">
                <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                  Cancel
                </button>
                <button className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90">
                  Track & Generate
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3: Review & Analytics */}
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-semibold">
              <BrainCircuit className="w-4 h-4" />
              <span>Advanced Spaced Repetition</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              Review smarter, not harder.
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Temar&apos;s dashboard tracks the <strong>retrievability</strong>{' '}
              and <strong>stability</strong> of every chunk you study. It
              schedules reviews precisely when you&apos;re about to forget them.
              During reviews, write your answer and get instant AI feedback
              before grading yourself (Again, Hard, Good, Easy).
            </p>
            <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
              <h4 className="font-bold text-sm mb-3 flex items-center">
                <Activity className="w-4 h-4 mr-2 text-orange-500" />
                Identify Knowledge Gaps
              </h4>
              <p className="text-sm text-muted-foreground">
                The dashboard automatically flags &quot;Underperforming
                Chunks&quot; based on lapse thresholds, ensuring you never let
                difficult concepts slip through the cracks.
              </p>
            </div>
          </div>

          {/* Mock: Review & Dashboard */}
          <div className="lg:w-1/2 w-full space-y-4">
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Recall Items Dashboard
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div className="w-1/2">
                    <div className="text-sm font-bold truncate">
                      Implement Stack with Dynamic Array
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      DS&A &gt; ADTs & Data Structures
                    </div>
                  </div>
                  <div className="w-1/4 px-2">
                    <div className="w-full bg-muted rounded-full h-1.5 mb-1">
                      <div
                        className="bg-primary h-1.5 rounded-full"
                        style={{ width: '20%' }}
                      />
                    </div>
                    <div className="text-[10px] text-muted-foreground text-right">
                      20% Retrievability
                    </div>
                  </div>
                  <div className="text-xs text-red-500 font-medium">
                    Due Now
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="w-1/2">
                    <div className="text-sm font-bold truncate">
                      ADT vs. Data Structure
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      DS&A &gt; ADTs & Data Structures
                    </div>
                  </div>
                  <div className="w-1/4 px-2">
                    <div className="w-full bg-muted rounded-full h-1.5 mb-1">
                      <div
                        className="bg-primary h-1.5 rounded-full"
                        style={{ width: '80%' }}
                      />
                    </div>
                    <div className="text-[10px] text-muted-foreground text-right">
                      80% Retrievability
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    Due in 2 days
                  </div>
                </div>
              </div>
            </div>

            {/* Review Session Mock */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg">
              <div className="flex border-b border-border">
                <div className="w-1/2 p-4 border-r border-border">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">
                    PROBLEM DETAILS
                  </div>
                  <div className="bg-muted/50 p-3 rounded font-mono text-xs text-foreground leading-relaxed">
                    class Stack:
                    <br />
                    &nbsp;&nbsp;def __init__(self):
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;pass
                    <br />
                    <br />
                    &nbsp;&nbsp;def push(self, item):
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;pass
                  </div>
                </div>
                <div className="w-1/2 p-4 bg-muted/20 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2">
                      YOUR ANSWER
                    </div>
                    <div className="text-sm text-muted-foreground italic">
                      Write your answer here...
                    </div>
                  </div>
                  <button className="mt-4 w-full py-2 bg-card border border-border shadow-sm rounded flex items-center justify-center text-sm font-semibold hover:bg-muted transition-colors">
                    <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                    Analyze Answer
                  </button>
                </div>
              </div>
              <div className="p-3 bg-card flex justify-end space-x-2 border-t border-border">
                <button className="px-3 py-1.5 bg-fsrs-again-bg text-fsrs-again text-xs font-bold rounded">
                  1 Again
                </button>
                <button className="px-3 py-1.5 bg-fsrs-hard-bg text-fsrs-hard text-xs font-bold rounded">
                  2 Hard
                </button>
                <button className="px-3 py-1.5 bg-fsrs-good-bg text-fsrs-good text-xs font-bold rounded">
                  3 Good
                </button>
                <button className="px-3 py-1.5 bg-fsrs-easy-bg text-fsrs-easy text-xs font-bold rounded">
                  4 Easy
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section
        id="methodology"
        className="py-24 px-6 max-w-7xl mx-auto border-t border-border"
      >
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <BookOpenCheck className="w-4 h-4" />
            <span>The Science Behind Temar</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
            Built on proven learning science.
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Temar combines three evidence-based principles to give you the most
            efficient path from reading to remembering.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Target className="w-6 h-6 text-primary" />,
              title: 'Active Recall',
              body: 'Retrieving information from memory is more effective than re-reading. Every review session forces your brain to reconstruct knowledge.',
            },
            {
              icon: <CalendarCheck className="w-6 h-6 text-primary" />,
              title: 'Spaced Repetition',
              body: 'The FSRS algorithm schedules reviews at optimal intervals — just before you forget — compounding retention over time with less effort.',
            },
            {
              icon: <Layers className="w-6 h-6 text-primary" />,
              title: 'Elaborative Encoding',
              body: 'Breaking material into atomic chunks and linking them forces deeper processing, making new knowledge stick to what you already know.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="group flex flex-col items-start gap-4 bg-card border border-border rounded-xl p-8 hover:-translate-y-1 hover:shadow-md hover:border-primary/20 transition-all duration-200"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-24 border-y border-border overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything you need to{' '}
              <span className="text-primary">guarantee retention</span>
            </h2>
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              Built on the latest memory science — so you spend less time
              reviewing and more time truly knowing.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                icon: <Crosshair className="w-6 h-6 text-primary" />,
                word: 'Precision',
                label: 'Lapse & Stability Tracking',
                desc: 'Identify underperforming chunks before test day.',
              },
              {
                icon: <Zap className="w-6 h-6 text-primary" />,
                word: 'Fluid',
                label: 'Automated Scheduling',
                desc: "Calendar views show exactly what's due and when.",
              },
              {
                icon: <BookOpen className="w-6 h-6 text-primary" />,
                word: 'Depth',
                label: 'Multi-modal Testing',
                desc: 'Mix coding, MCQ, and open-ended recall.',
              },
              {
                icon: <Eye className="w-6 h-6 text-primary" />,
                word: 'Clarity',
                label: 'Real-time Retrievability',
                desc: 'See a visual percentage of your memory decay.',
              },
            ].map((stat) => (
              <div
                key={stat.word}
                className="group bg-card border border-border rounded-xl p-6 text-center hover:-translate-y-1 hover:shadow-md hover:border-primary/25 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/15 transition-colors">
                  {stat.icon}
                </div>
                <div className="text-2xl font-extrabold text-primary mb-1">
                  {stat.word}
                </div>
                <div className="text-sm font-semibold mb-2">{stat.label}</div>
                <p className="text-xs text-muted-foreground">{stat.desc}</p>
              </div>
            ))}
          </div>
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
          className="px-10 py-4 bg-primary text-primary-foreground font-bold text-lg rounded-md shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25 hover:scale-[1.02] transition-all duration-200 inline-flex items-center gap-2"
        >
          Start Learning Free
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}
