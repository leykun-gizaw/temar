import { ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnswerRubric } from '@/lib/fetchers/recall-items';

export function ReviewRubricDisplay({
  rubric,
  isHistoryView = false,
}: {
  rubric: AnswerRubric | null;
  isHistoryView?: boolean;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
        <ListChecks className="h-3.5 w-3.5" />
        {rubric?.type === 'mcq'
          ? isHistoryView
            ? 'Choices'
            : 'Choose one answer'
          : rubric?.type === 'leetcode'
          ? 'Problem Details'
          : 'Answer Rubric'}
      </h3>

      {!rubric ? (
        <p className="text-sm text-muted-foreground italic">
          {isHistoryView
            ? 'No rubric available.'
            : 'No rubric available. Self-assess your recall.'}
        </p>
      ) : rubric.type === 'mcq' ? (
        <div className="space-y-2">
          {rubric.choices.map((choice) => (
            <div
              key={choice.label}
              className={cn(
                'flex items-start gap-2.5 rounded-lg border p-3',
                !isHistoryView && 'hover:bg-muted/50 transition-colors',
                isHistoryView &&
                  choice.label === rubric.correctAnswer &&
                  'border-green-500/50 bg-green-50 dark:bg-green-950/20'
              )}
            >
              <span
                className={cn(
                  'shrink-0 mt-0.5 h-5 w-5 rounded-full text-xs flex items-center justify-center font-bold',
                  isHistoryView && choice.label === rubric.correctAnswer
                    ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                    : 'bg-primary/10 text-primary'
                )}
              >
                {choice.label}
              </span>
              <span className="text-sm leading-relaxed">{choice.text}</span>
            </div>
          ))}
          {isHistoryView && rubric.explanation && (
            <div className="mt-3 p-3 rounded-md bg-muted/30 border">
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Explanation
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {rubric.explanation}
              </p>
            </div>
          )}
        </div>
      ) : rubric.type === 'leetcode' ? (
        <div className="space-y-4">
          {rubric.functionPrototype && (
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Function Signature
              </h4>
              <pre className="text-sm bg-muted/50 rounded-md p-3 overflow-auto font-mono">
                {rubric.functionPrototype}
              </pre>
            </div>
          )}
          {rubric.examples && rubric.examples.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Examples
              </h4>
              <div className="space-y-3">
                {rubric.examples.map((ex, i) => (
                  <div
                    key={i}
                    className="rounded-lg border p-3 bg-muted/20 space-y-1.5"
                  >
                    <p className="text-xs">
                      <span className="font-semibold text-muted-foreground">
                        Input:{' '}
                      </span>
                      <code className="text-xs bg-muted rounded px-1 py-0.5">
                        {ex.input}
                      </code>
                    </p>
                    <p className="text-xs">
                      <span className="font-semibold text-muted-foreground">
                        Output:{' '}
                      </span>
                      <code className="text-xs bg-muted rounded px-1 py-0.5">
                        {ex.output}
                      </code>
                    </p>
                    {ex.explanation && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold">Explanation: </span>
                        {ex.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {rubric.constraints && rubric.constraints.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Constraints
              </h4>
              <ul className="space-y-1">
                {rubric.constraints.map((c, i) => (
                  <li
                    key={i}
                    className="text-xs text-muted-foreground flex items-start gap-2"
                  >
                    <span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                    <code className="text-xs">{c}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : rubric.type === 'open_ended' ? (
        <div className="space-y-4">
          {'sections' in rubric &&
            rubric.sections &&
            rubric.sections.length > 0 && (
              <div>
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Required Sections
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {rubric.sections.map((s, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          {'criteria' in rubric &&
            rubric.criteria &&
            rubric.criteria.length > 0 && (
              <ol className="space-y-2">
                {rubric.criteria.map((c, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground flex items-start gap-2.5"
                  >
                    <span className="shrink-0 mt-0.5 h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{c}</span>
                  </li>
                ))}
              </ol>
            )}
        </div>
      ) : (
        <div>
          {'criteria' in rubric &&
          rubric.criteria &&
          rubric.criteria.length > 0 ? (
            <ol className="space-y-2">
              {rubric.criteria.map((c, i) => (
                <li
                  key={i}
                  className="text-sm text-muted-foreground flex items-start gap-2.5"
                >
                  <span className="shrink-0 mt-0.5 h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{c}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              {isHistoryView
                ? 'No rubric available.'
                : 'No rubric available. Self-assess your recall.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
