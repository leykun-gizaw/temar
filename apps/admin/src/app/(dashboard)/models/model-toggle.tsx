'use client';

import { Switch } from '@/components/ui/switch';
import { toggleModelActive } from './actions';
import { useState } from 'react';

export function ModelToggle({
  modelId,
  initialActive,
}: {
  modelId: string;
  initialActive: boolean;
}) {
  const [active, setActive] = useState(initialActive);
  const [loading, setLoading] = useState(false);

  async function handleToggle(checked: boolean) {
    setLoading(true);
    setActive(checked);
    await toggleModelActive(modelId, checked);
    setLoading(false);
  }

  return (
    <Switch
      checked={active}
      onCheckedChange={handleToggle}
      disabled={loading}
    />
  );
}
