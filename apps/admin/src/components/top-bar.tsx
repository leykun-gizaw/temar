'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/models': 'Models',
  '/pricing': 'Pricing',
  '/markup': 'Markup',
  '/operations': 'Operations',
  '/usage': 'Usage Log',
  '/analytics': 'Analytics',
};

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();

  const title = pageTitles[pathname] ?? 'Dashboard';

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <h1 className="text-lg font-semibold">{title}</h1>
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </header>
  );
}
