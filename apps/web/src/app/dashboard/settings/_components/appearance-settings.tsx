'use client';

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
    <div className="space-y-8">
      <section className="bg-muted/40 rounded-[2rem] p-8 shadow-md">
        <h3 className="text-xl font-bold mb-6">Theme</h3>
        <div className="flex gap-4">
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={cn(
                'flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-colors flex-1',
                theme === opt.value
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent bg-background/60 hover:border-primary/30'
              )}
            >
              <opt.icon className="w-6 h-6" />
              <span className="text-sm font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-muted/40 rounded-[2rem] p-8 shadow-md">
        <h3 className="text-xl font-bold mb-6">Accent Color</h3>
        <div className="flex gap-4">
          {[
            { name: 'Amber', color: 'bg-[oklch(0.52_0.14_55)]' },
            { name: 'Green', color: 'bg-[oklch(0.52_0.1_150)]' },
            { name: 'Blue', color: 'bg-[oklch(0.55_0.1_240)]' },
            { name: 'Rose', color: 'bg-[oklch(0.55_0.12_20)]' },
          ].map((accent) => (
            <button
              key={accent.name}
              className={cn(
                'flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-colors',
                accent.name === 'Amber'
                  ? 'border-primary'
                  : 'border-transparent bg-background/60 hover:border-primary/30'
              )}
            >
              <div className={`w-10 h-10 rounded-full ${accent.color}`} />
              <span className="text-xs font-medium">{accent.name}</span>
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Accent color customization coming soon.
        </p>
      </section>
    </div>
  );
}
