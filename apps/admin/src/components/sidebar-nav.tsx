'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Cpu,
  DollarSign,
  Percent,
  Settings2,
  ScrollText,
  BarChart3,
  RefreshCw,
} from 'lucide-react';

const navItems = [
  { href: '/models', label: 'Models', icon: Cpu },
  { href: '/pricing', label: 'Pricing', icon: DollarSign },
  { href: '/pricing-sync', label: 'Pricing Sync', icon: RefreshCw },
  { href: '/markup', label: 'Markup', icon: Percent },
  { href: '/operations', label: 'Operations', icon: Settings2 },
  { href: '/usage', label: 'Usage Log', icon: ScrollText },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3 py-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
