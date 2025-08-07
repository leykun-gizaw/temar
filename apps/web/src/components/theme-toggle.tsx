'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const toggleTheme = () =>
    theme === 'light' ? setTheme('dark') : setTheme('light');

  if (!mounted) return;

  return (
    <>
      <Button
        onClick={toggleTheme}
        className="cursor-pointer size-8"
        variant={'outline'}
      >
        {theme === 'light' ? <Sun /> : <Moon />}
      </Button>
    </>
  );
}
