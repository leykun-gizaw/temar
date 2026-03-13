'use client';

import { UserButton } from '@daveyplate/better-auth-ui';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

function ThemeMenuItem() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <DropdownMenuItem
      className="cursor-pointer"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? (
        <Sun className="mr-2 h-4 w-4" />
      ) : (
        <Moon className="mr-2 h-4 w-4" />
      )}
      {isDark ? 'Light mode' : 'Dark mode'}
    </DropdownMenuItem>
  );
}

export function NavUser() {
  return (
    <UserButton
      size="icon"
      side="bottom"
      align="end"
      additionalLinks={[<ThemeMenuItem key="theme" />]}
    />
  );
}
