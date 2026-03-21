'use client';

import { useState, useTransition } from 'react';
import { Loader2, ArrowBigDownDashIcon } from 'lucide-react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  trackTopic,
  trackNote,
  trackChunk,
  untrackTopic,
  untrackNote,
  untrackChunk,
} from '@/lib/actions/tracking';
import { notifyPassBalanceChanged } from '@/lib/pass-events';

const QUESTION_TYPES = [
  {
    id: 'open_ended',
    label: 'Open-ended',
    description: 'Written explanation',
  },
  {
    id: 'mcq',
    label: 'Multiple choice',
    description: 'Choose from 4 options',
  },
  {
    id: 'leetcode',
    label: 'Algorithm',
    description: 'Problem-solving / code',
  },
] as const;

interface TrackingButtonProps {
  entityType: 'topic' | 'note' | 'chunk';
  entityId: string;
  topicId?: string;
  noteId?: string;
  isTracked: boolean;
  compact?: boolean;
  contentLength?: number;
}

export default function TrackingButton({
  entityType,
  entityId,
  topicId,
  noteId,
  isTracked: initialTracked,
  compact = false,
  contentLength,
}: TrackingButtonProps) {
  const [tracked, setTracked] = useState(initialTracked);
  const [isPending, startTransition] = useTransition();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [errorIsPassInsufficient, setErrorIsPassInsufficient] = useState(false);

  const suggestedCount = Math.min(
    Math.max(Math.ceil((contentLength ?? 1500) / 500), 2),
    10
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['open_ended']);
  const [questionCount, setQuestionCount] = useState(suggestedCount);

  const toggleType = (typeId: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((t) => t !== typeId)
        : [...prev, typeId]
    );
  };

  const runTrack = (
    types: string[] | undefined,
    count: number | undefined
  ) => {
    startTransition(async () => {
      let result;
      try {
        if (entityType === 'topic') {
          result = await trackTopic(entityId, types, count);
        } else if (entityType === 'note') {
          result = await trackNote(
            entityId,
            topicId ?? '',
            types,
            count
          );
        } else {
          result = await trackChunk(
            entityId,
            noteId ?? '',
            topicId ?? '',
            types,
            count
          );
        }
        if (result.status === 'success') {
          setTracked(true);
          setPopoverOpen(false);
          if (result.newBalance != null)
            notifyPassBalanceChanged(result.newBalance);
        } else if (result.status === 'insufficient_pass') {
          setPopoverOpen(false);
          setErrorIsPassInsufficient(true);
          setPassError(
            `Not enough Pass (have ${result.balance}, need ${result.required}). Top up at /dashboard/billing.`
          );
        } else if (result.status === 'error') {
          setPopoverOpen(false);
          setErrorIsPassInsufficient(false);
          setPassError(result.message);
        }
      } catch (err) {
        console.error('Track failed:', err);
      }
    });
  };

  const handleTrackConfirm = () => {
    const types = selectedTypes.length > 0 ? selectedTypes : undefined;
    const count = questionCount > 0 ? questionCount : undefined;
    runTrack(types, count);
  };

  const handleUntrack = () => {
    startTransition(async () => {
      try {
        if (entityType === 'topic') {
          await untrackTopic(entityId);
        } else if (entityType === 'note') {
          await untrackNote(entityId, topicId ?? '');
        } else {
          await untrackChunk(entityId, noteId ?? '', topicId ?? '');
        }
        setTracked(false);
        setPopoverOpen(false);
      } catch (err) {
        console.error('Untrack failed:', err);
      }
    });
  };

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <span
            role="button"
            tabIndex={0}
            className={`inline-flex items-center gap-1 transition-colors cursor-pointer text-xs ${
              tracked
                ? 'text-primary hover:text-primary/70'
                : 'text-muted-foreground hover:text-primary'
            }`}
            title={tracked ? `Tracking ${entityType}` : `Track ${entityType}`}
          >
            {isPending ? (
              <Loader2 size={compact ? 14 : 16} className="animate-spin" />
            ) : (
              <ArrowBigDownDashIcon size={compact ? 16 : 18} />
            )}
            {!compact && (
              <span>{tracked ? 'Tracking' : 'Track'}</span>
            )}
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="end" sideOffset={8}>
          {tracked ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold">Tracking active</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  This {entityType} is being tracked for recall.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 rounded-xl text-xs bg-destructive/10 hover:bg-destructive/20 text-destructive"
                onClick={handleUntrack}
                disabled={isPending}
              >
                {isPending && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
                Untrack
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold">Track for recall</p>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Question types</Label>
                {QUESTION_TYPES.map((type) => (
                  <div key={type.id} className="flex items-start gap-2">
                    <Checkbox
                      id={`qtype-${type.id}`}
                      checked={selectedTypes.includes(type.id)}
                      onCheckedChange={() => toggleType(type.id)}
                      className="mt-0.5"
                    />
                    <div className="grid gap-0 leading-tight">
                      <Label
                        htmlFor={`qtype-${type.id}`}
                        className="text-xs font-medium cursor-pointer"
                      >
                        {type.label}
                      </Label>
                      <p className="text-[0.65rem] text-muted-foreground">
                        {type.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="question-count" className="text-xs font-medium">
                  Questions
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="question-count"
                    type="number"
                    min={1}
                    max={20}
                    value={questionCount}
                    onChange={(e) =>
                      setQuestionCount(
                        Math.max(1, Math.min(20, parseInt(e.target.value) || 1))
                      )
                    }
                    className="w-16 h-7 text-xs rounded-xl"
                  />
                  <span className="text-[0.65rem] text-muted-foreground">
                    Suggested: {suggestedCount}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-7 rounded-xl text-xs"
                  onClick={() => setPopoverOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex-1 h-7 rounded-xl text-xs"
                  onClick={handleTrackConfirm}
                  disabled={isPending || selectedTypes.length === 0}
                >
                  {isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                  Track & Generate
                </Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Error dialog — contextual title based on error type */}
      <Dialog
        open={!!passError}
        onOpenChange={(open) => {
          if (!open) setPassError(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {errorIsPassInsufficient ? 'Not enough Pass' : 'Generation failed'}
            </DialogTitle>
            <DialogDescription>{passError}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPassError(null)}>
              Close
            </Button>
            {errorIsPassInsufficient && (
              <Button asChild>
                <a href="/dashboard/billing">Top up Pass</a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
