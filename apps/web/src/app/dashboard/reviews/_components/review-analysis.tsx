import type { AnalysisResult } from '@/lib/actions/analysis';
import { Sparkles, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ReviewAnalysis({
  analysis,
  className,
  hideTitle,
  scoreSize = 'lg',
}: {
  analysis: AnalysisResult;
  className?: string;
  hideTitle?: boolean;
  scoreSize?: 'sm' | 'lg';
}) {
  const scoreColor =
    analysis.suggestedRating === 1
      ? 'text-fsrs-again'
      : analysis.suggestedRating === 2
      ? 'text-fsrs-hard'
      : analysis.suggestedRating === 3
      ? 'text-fsrs-good'
      : 'text-fsrs-easy';

  const barColor =
    analysis.suggestedRating === 1
      ? 'bg-fsrs-again'
      : analysis.suggestedRating === 2
      ? 'bg-fsrs-hard'
      : analysis.suggestedRating === 3
      ? 'bg-fsrs-good'
      : 'bg-fsrs-easy';

  return (
    <div className={className}>
      {!hideTitle && (
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-3 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          AI Analysis
        </h3>
      )}
      <div
        className={cn(
          'space-y-4',
          !hideTitle && 'rounded-2xl p-5 bg-secondary/5'
        )}
      >
        {/* Score display */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Mastery Score
            </p>
            <div className="flex items-baseline gap-0.5">
              <span
                className={cn(
                  'font-extrabold leading-none',
                  scoreColor,
                  scoreSize === 'lg' ? 'text-4xl' : 'text-2xl'
                )}
              >
                {analysis.scorePercent}
              </span>
              <span
                className={cn(
                  'font-bold',
                  scoreColor,
                  scoreSize === 'lg' ? 'text-lg' : 'text-sm'
                )}
              >
                %
              </span>
            </div>
          </div>
          <div className="w-28 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', barColor)}
              style={{ width: `${analysis.scorePercent}%` }}
            />
          </div>
        </div>

        {/* Suggested rating */}
        <p className="text-xs text-muted-foreground">
          Suggested:{' '}
          <span className={cn('font-bold', scoreColor)}>
            {analysis.suggestedLabel}
          </span>
        </p>

        {/* Strengths */}
        {analysis.strengths && analysis.strengths.length > 0 && (
          <div>
            <p className="text-xs font-bold mb-1.5">Strengths</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {analysis.strengths.join('. ')}.
            </p>
          </div>
        )}

        {/* Reasoning as recommendation */}
        {analysis.reasoning && (
          <div className="p-4 bg-card rounded-xl shadow-sm">
            <p className="text-xs font-bold text-primary mb-1.5 flex items-center gap-1">
              <Lightbulb className="h-3.5 w-3.5" />
              Feedback
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed italic">
              &ldquo;{analysis.reasoning}&rdquo;
            </p>
          </div>
        )}

        {/* Weaknesses */}
        {analysis.weaknesses && analysis.weaknesses.length > 0 && (
          <div>
            <p className="text-xs font-bold text-fsrs-again mb-1.5">
              Areas to improve
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {analysis.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-fsrs-again/50" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
