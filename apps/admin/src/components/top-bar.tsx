'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '@temar/ui';
import { LogOut, Sun, Moon } from 'lucide-react';

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
  const { theme, setTheme } = useTheme();

  const title = pageTitles[pathname] ?? 'Dashboard';

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="flex h-14 items-center justify-between bg-background/80 backdrop-blur-sm px-6">
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
