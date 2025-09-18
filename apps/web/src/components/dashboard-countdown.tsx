'use client';

import { useEffect, useState, useMemo } from 'react';

type Props = {
  target: Date | string | number | null;
};

export default function DashboardCountdown({ target }: Props) {
  // Convert target to ms (stable)
  const targetMs = useMemo(() => {
    if (!target) return null;
    const d =
      target instanceof Date
        ? target
        : new Date(
            typeof target === 'number'
              ? target < 1e12
                ? target * 1000
                : target
              : target
          );
    if (isNaN(d.getTime())) return null;
    return d.getTime();
  }, [target]);

  // Defer dynamic time calculation until after mount to avoid hydration issues
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (targetMs == null) return;
    const compute = () => Math.max(0, targetMs - Date.now());
    setRemaining(compute());
    if (targetMs <= Date.now()) {
      setRemaining(0);
      return;
    }
    const id = setInterval(() => {
      const diff = compute();
      setRemaining(diff);
      if (diff <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  const format = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  return <>{format(remaining ?? 0)}</>;
}
