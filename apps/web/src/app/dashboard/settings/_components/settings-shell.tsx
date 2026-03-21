'use client';

import { useState, type ReactNode } from 'react';
import { User, Shield, BrainCircuit, Palette, Coins } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'ai', label: 'AI & Data', icon: BrainCircuit },
  { id: 'appearance', label: 'Appearance', icon: Palette },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function SettingsShell({
  children,
}: {
  children: Record<TabId, ReactNode>;
}) {
  const [active, setActive] = useState<TabId>('account');

  return (
    <div className="flex gap-8 h-[calc(100vh-10rem)]">
      {/* Left sidebar nav — fixed, never scrolls */}
      <nav className="w-[200px] shrink-0 space-y-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              'flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-xl transition-colors',
              active === tab.id
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
        <Link
          href="/dashboard/billing"
          className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-xl text-muted-foreground hover:bg-muted transition-colors"
        >
          <Coins className="w-5 h-5" />
          Billing
        </Link>
      </nav>

      {/* Right content pane — scrolls independently */}
      <div className="flex-1 min-w-0 space-y-8 overflow-y-auto pr-2">
        {children[active]}
      </div>
    </div>
  );
}
