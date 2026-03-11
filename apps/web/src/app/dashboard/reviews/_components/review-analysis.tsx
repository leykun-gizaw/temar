import type { AnalysisResult } from '@/lib/actions/analysis';
import { Sparkles } from 'lucide-react';
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
  return (
    <div className={className}>
      {!hideTitle && (
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Analysis Results
        </h3>
      )}
      <div
        className={cn(
          'space-y-3',
          !hideTitle && 'rounded-md border p-4 bg-muted/20'
        )}
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'font-bold',
              scoreSize === 'lg' ? 'text-lg' : 'text-sm',
              analysis.suggestedRating === 1
                ? 'text-fsrs-again'
                : analysis.suggestedRating === 2
                ? 'text-fsrs-hard'
                : analysis.suggestedRating === 3
                ? 'text-fsrs-good'
                : 'text-fsrs-easy'
            )}
          >
            {analysis.scorePercent}%
          </span>
          <span className="text-xs text-muted-foreground">
            Suggested:{' '}
            <span className="font-medium text-foreground">
              {analysis.suggestedLabel}
            </span>
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {analysis.reasoning}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {analysis.strengths && analysis.strengths.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold text-green-600 dark:text-green-400 mb-1 uppercase tracking-wider">
                Strengths
              </h4>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {analysis.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-fsrs-good shrink-0">+</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {analysis.weaknesses && analysis.weaknesses.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold text-red-600 dark:text-red-400 mb-1 uppercase tracking-wider">
                Weaknesses
              </h4>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {analysis.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-fsrs-again shrink-0">-</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
