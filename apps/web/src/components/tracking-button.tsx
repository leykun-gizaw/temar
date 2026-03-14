'use client';

import { useState, useTransition } from 'react';
import { Loader2, Plus, X, ArrowBigDownDashIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    label: 'Open-ended explainer',
    description: 'Written explanation demonstrating understanding',
  },
  {
    id: 'mcq',
    label: 'Multiple choice (MCQ)',
    description: 'Choose from 4 options',
  },
  {
    id: 'leetcode',
    label: 'Algorithm / Leetcode-style',
    description: 'Problem requiring a solution approach or code',
  },
] as const;

interface TrackingButtonProps {
  entityType: 'topic' | 'note' | 'chunk';
  entityId: string;
  topicId?: string;
  noteId?: string;
  isTracked: boolean;
  /** Compact mode for card action rows (icon only, no label) */
  compact?: boolean;
  /** Content length in characters, used to suggest question count */
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [consentState, setConsentState] = useState<{
    estimatedPassCost: number;
    basePassCost: number;
    onApprove: (cost: number) => void;
  } | null>(null);

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
    count: number | undefined,
    consentedPassCost?: number
  ) => {
    startTransition(async () => {
      let result;
      try {
        if (entityType === 'topic') {
          result = await trackTopic(entityId, types, count, consentedPassCost);
        } else if (entityType === 'note') {
          result = await trackNote(
            entityId,
            topicId ?? '',
            types,
            count,
            consentedPassCost
          );
        } else {
          result = await trackChunk(
            entityId,
            noteId ?? '',
            topicId ?? '',
            types,
            count,
            consentedPassCost
          );
        }
        if (result.status === 'success') {
          setTracked(true);
          if (result.newBalance != null)
            notifyPassBalanceChanged(result.newBalance);
        } else if (result.status === 'consent_required') {
          setConsentState({
            estimatedPassCost: result.estimatedPassCost,
            basePassCost: result.basePassCost,
            onApprove: (cost) => runTrack(types, count, cost),
          });
        } else if (result.status === 'insufficient_pass') {
          setPassError(
            `Not enough Pass (have ${result.balance}, need ${result.required}). Top up at /dashboard/billing.`
          );
        } else if (result.status === 'error') {
          setPassError(result.message);
        }
      } catch (err) {
        console.error('Track failed:', err);
      }
    });
  };

  const handleTrackConfirm = () => {
    setDialogOpen(false);
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
      } catch (err) {
        console.error('Untrack failed:', err);
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <span
            role="button"
            tabIndex={0}
            className={`transition-colors cursor-pointer ${
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
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {!tracked && (
            <DropdownMenuItem
              onClick={() => setDialogOpen(true)}
              disabled={isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              Track for recall
            </DropdownMenuItem>
          )}
          {tracked && (
            <DropdownMenuItem
              onClick={handleUntrack}
              disabled={isPending}
              className="text-destructive focus:text-destructive"
            >
              <X className="h-4 w-4 mr-2" />
              Untrack
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Question Generation</DialogTitle>
            <DialogDescription>
              Choose question types and how many to generate for this{' '}
              {entityType}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Question Types</Label>
              {QUESTION_TYPES.map((type) => (
                <div key={type.id} className="flex items-start gap-3">
                  <Checkbox
                    id={`qtype-${type.id}`}
                    checked={selectedTypes.includes(type.id)}
                    onCheckedChange={() => toggleType(type.id)}
                  />
                  <div className="grid gap-0.5 leading-none">
                    <Label
                      htmlFor={`qtype-${type.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {type.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="question-count" className="text-sm font-medium">
                Number of Questions
              </Label>
              <div className="flex items-center gap-3">
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
                  className="w-20"
                />
                <span className="text-xs text-muted-foreground">
                  Suggested: {suggestedCount} (based on content length)
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTrackConfirm}
              disabled={isPending || selectedTypes.length === 0}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Track & Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pass consent dialog */}
      <Dialog
        open={!!consentState}
        onOpenChange={(open) => {
          if (!open) setConsentState(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Extra Pass required</DialogTitle>
            <DialogDescription>
              This content is larger than the standard budget. Question
              generation will cost{' '}
              <strong>{consentState?.estimatedPassCost} Pass</strong> instead of
              the base {consentState?.basePassCost} Pass.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConsentState(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (consentState) {
                  consentState.onApprove(consentState.estimatedPassCost);
                  setConsentState(null);
                }
              }}
            >
              Approve &amp; Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pass insufficient error dialog */}
      <Dialog
        open={!!passError}
        onOpenChange={(open) => {
          if (!open) setPassError(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Not enough Pass</DialogTitle>
            <DialogDescription>{passError}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPassError(null)}>
              Close
            </Button>
            <Button asChild>
              <a href="/dashboard/billing">Top up Pass</a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
