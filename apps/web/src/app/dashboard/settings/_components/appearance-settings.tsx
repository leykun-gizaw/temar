'use client';

import { Card } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Visual shell component — theme toggle and accent color picker.
 * Accent color selection is decorative only for now.
 */
export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-5 rounded-2xl bg-muted/50">
        <h3 className="text-sm font-semibold mb-4">Theme</h3>
        <div className="flex gap-3">
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors flex-1',
                theme === opt.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30'
              )}
            >
              <opt.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5 rounded-2xl bg-muted/50">
        <h3 className="text-sm font-semibold mb-4">Accent Color</h3>
        <div className="flex gap-3">
          {[
            { name: 'Amber', color: 'bg-[oklch(0.52_0.14_55)]' },
            { name: 'Green', color: 'bg-[oklch(0.52_0.1_150)]' },
            { name: 'Blue', color: 'bg-[oklch(0.55_0.1_240)]' },
            { name: 'Rose', color: 'bg-[oklch(0.55_0.12_20)]' },
          ].map((accent) => (
            <button
              key={accent.name}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors',
                accent.name === 'Amber'
                  ? 'border-primary'
                  : 'border-border hover:border-primary/30'
              )}
            >
              <div className={`w-8 h-8 rounded-full ${accent.color}`} />
              <span className="text-[0.65rem] font-medium">{accent.name}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Accent color customization coming soon.
        </p>
      </Card>
    </div>
  );
}
