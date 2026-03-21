'use client';
import Link from 'next/link';
import { useState } from 'react';
import { LayoutDashboard, LogOut, Menu, Moon, Sun, X } from 'lucide-react';
import Logo from '@/assets/logo';
import { ThemeToggle } from './theme-toggle';
import { authClient } from '@/lib/auth-client';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NavLink {
  href: string;
  label: string;
}

const primaryLinks: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/materials', label: 'Library' },
  { href: '/dashboard/settings', label: 'Settings' },
];

const authLinks: NavLink[] = [
  { href: '/auth/sign-in', label: 'Sign In' },
  { href: '/auth/sign-up', label: 'Sign Up' },
];

function AccountMenu({
  user,
}: {
  user: { name?: string | null; email: string; image?: string | null };
}) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const isDark = theme === 'dark';
  const initials = (user.name ?? user.email)
    .split(' ')
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Account menu"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={user.image ?? undefined}
              alt={user.name ?? user.email}
            />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-52">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          {user.name && (
            <span className="text-sm font-medium">{user.name}</span>
          )}
          <span className="text-xs font-normal text-muted-foreground truncate">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
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
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SiteNavbar() {
  const [open, setOpen] = useState(false);
  const { data, isPending } = authClient.useSession();

  const isLoggedIn = !!data;

  return (
    <header className="mx-auto flex flex-1 fixed left-1/8 top-3 z-40 h-16 rounded-2xl w-3/4 items-center bg-blur bg-transparent justify-between px-4 sm:px-6 lg:px-8 backdrop-blur">
      {!isPending ? (
        <>
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2"
              aria-label="Temar home"
            >
              <Logo size={44} />
              <span className="hidden sm:inline font-bold text-xl">Temar</span>
            </Link>
            <nav
              aria-label="Main"
              className="hidden md:flex items-center gap-6 text-sm"
            >
              {primaryLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-muted-foreground font-semibold hover:border-b transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm">
            {!isLoggedIn ? (
              <>
                {authLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={
                      l.label === 'Sign Up'
                        ? 'inline-flex h-9 items-center rounded-md bg-primary px-4 font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors'
                        : 'text-muted-foreground hover:text-foreground transition-colors'
                    }
                  >
                    {l.label}
                  </Link>
                ))}
                <ThemeToggle />
              </>
            ) : (
              data?.user && <AccountMenu user={data.user} />
            )}
          </div>
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </>
      ) : (
        ''
      )}
    </header>
  );
}

export default SiteNavbar;
