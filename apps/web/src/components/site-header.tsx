'use client';

import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
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
import { PassBalanceChip } from './pass-balance-chip';

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

  return (
    <header className="sticky top-0 z-50 h-12 flex shrink-0 items-center backdrop-blur-lg bg-background/80">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-1 data-[orientation=vertical]:h-4"
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
        <div className="ml-auto flex items-center gap-2">
          <PassBalanceChip />
          <NavUser />
        </div>
      </div>
    </header>
  );
}
