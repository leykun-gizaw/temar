'use client';

import { useState, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { resetAllData } from '@/lib/actions/reset';

const CONFIRM_PHRASE = 'reset all data';

export function DangerZone() {
  const [confirmText, setConfirmText] = useState('');
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = () => {
    if (confirmText !== CONFIRM_PHRASE) return;

    startTransition(async () => {
      const result = await resetAllData();
      if (result.success) {
        toast.success(
          'All data has been reset. You can reconnect Notion to start fresh.'
        );
        setShowConfirm(false);
        setConfirmText('');
      } else {
        toast.error(result.error ?? 'Failed to reset data');
      }
    });
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Danger Zone
        </CardTitle>
        <CardDescription>
          Permanently delete all your data and start from scratch. This cannot
          be undone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 space-y-2">
          <h4 className="text-sm font-semibold">Reset All Data</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This will permanently delete:
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
            <li>All topics, notes, and chunks</li>
            <li>All recall items and review history</li>
            <li>Your Notion connection and master page</li>
          </ul>
          <p className="text-xs text-muted-foreground">
            After resetting, you can reconnect Notion and start fresh with a new
            master page.
          </p>
        </div>

        {!showConfirm ? (
          <Button
            variant="destructive"
            onClick={() => setShowConfirm(true)}
            className="gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            Reset All Data
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-destructive font-medium">
              Type <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{CONFIRM_PHRASE}</code> to confirm:
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              className="max-w-xs"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                onClick={handleReset}
                disabled={confirmText !== CONFIRM_PHRASE || isPending}
                className="gap-1.5"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Confirm Reset
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmText('');
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
