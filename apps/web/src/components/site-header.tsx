'use client';

import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { NavUser } from '@/components/nav-user';
import { Fragment } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

export function SiteHeader() {
  const pathname = usePathname() ?? '/';
  const segments = pathname.split('/').filter(Boolean);

  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const items: { href: string; label: string; isLast: boolean }[] = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg === 'dashboard' || UUID_RE.test(seg)) continue;

    const href = '/' + segments.slice(0, i + 1).join('/');
    const label = seg.charAt(0).toUpperCase() + seg.slice(1);
    items.push({ href, label, isLast: false });
  }
  if (items.length > 0) {
    items[items.length - 1].isLast = true;
  }

  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 h-12 flex shrink-0 items-center backdrop-blur-lg border-b">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <div className="flex items-center">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <div>
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.forward()}
            >
              <ChevronRight size={20} />
            </Button>
          </div>
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              {items.map((item, i) => {
                return (
                  <Fragment key={item.href}>
                    <BreadcrumbItem className="text-xs">
                      {item.isLast ? (
                        <BreadcrumbPage className="text-[.95rem]">
                          {item.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild className="text-base">
                          <Link href={item.href}>{item.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {i < items.length - 1 ? <BreadcrumbSeparator /> : null}
                  </Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <NavUser />
        </div>
      </div>
    </header>
  );
}
