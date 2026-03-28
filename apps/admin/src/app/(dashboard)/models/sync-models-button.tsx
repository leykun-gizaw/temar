'use client';

import { useState } from 'react';
import { Button } from '@temar/ui';
import { RefreshCw } from 'lucide-react';
import { syncModelsFromProviders } from './actions';
import { toast } from 'sonner';

export function SyncModelsButton() {
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    setLoading(true);
    try {
      const result = await syncModelsFromProviders();
      const parts: string[] = [
        `Fetched ${result.fetched} models`,
        `${result.inserted} new`,
      ];
      if (result.errors.length > 0) {
        parts.push(`${result.errors.length} provider error(s)`);
      }
      toast.success(parts.join(', '));
      if (result.errors.length > 0) {
        for (const err of result.errors) {
          toast.warning(err);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleSync} disabled={loading}>
      <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Syncing...' : 'Sync from APIs'}
    </Button>
  );
}
