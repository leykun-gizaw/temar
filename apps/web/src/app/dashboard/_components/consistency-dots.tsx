'use client';

import { Card } from '@temar/ui';
import { Check, X } from 'lucide-react';

/**
 * Visual shell component — displays a 7-day activity streak with checkmarks.
 * Uses static placeholder data for now.
 */
export function ConsistencyDots() {
  // Placeholder data: true = active day, false = missed
  const days = [true, true, false, true, true, true, true];
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const streakCount = days.filter(Boolean).length;

  return (
    <Card className="p-6 rounded-[2rem] bg-secondary/10">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Consistency
      </h3>
      <div className="flex items-center justify-between gap-1.5 mb-3">
        {days.map((active, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                active
                  ? 'bg-secondary-foreground/15 text-secondary-foreground'
                  : 'bg-destructive/10 text-destructive/60'
              }`}
            >
              {active ? (
                <Check className="w-4 h-4" strokeWidth={3} />
              ) : (
                <X className="w-4 h-4" strokeWidth={2.5} />
              )}
            </div>
            <span className="text-[0.6rem] text-muted-foreground">
              {dayLabels[i]}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Your rhythm is blooming.{' '}
        <span className="font-semibold text-foreground">{streakCount} days streak.</span>
      </p>
    </Card>
  );
}
