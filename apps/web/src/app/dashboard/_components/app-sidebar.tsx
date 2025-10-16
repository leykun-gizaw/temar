'use client';

import * as React from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import Logo from '@/assets/logo';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
// import { TopicsSidebarPanel } from '@/components/sidebar/topics-sidebar-panel';
import { NAV_ITEMS } from '../_constants/ITEMS';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { setOpen, setOpenMobile, isMobile } = useSidebar();
  // No per-tab title here; Topics panel renders its own header/content.

  // Path-driven default behavior: closed on /dashboard, open on /dashboard/topics
  React.useEffect(() => {
    if (pathname === '/dashboard') {
      isMobile ? setOpenMobile(false) : setOpen(false);
      return;
    }
    if (pathname === '/dashboard/topics') {
      isMobile ? setOpenMobile(true) : setOpen(true);
      return;
    }
    // For other paths, do not auto-toggle; keep user choice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isMobile]);

  return (
    <Sidebar
      collapsible="none"
      className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
              <Link href="/dashboard">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Logo />
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="px-1.5 md:px-0">
            <SidebarMenu>
              {NAV_ITEMS?.map((item) => {
                const isActive = pathname?.startsWith(
                  item.url.replace(/\/$/, '')
                );
                return (
                  <SidebarMenuItem key={item.title}>
                    <Link href={item.url}>
                      <SidebarMenuButton
                        tooltip={{ children: item.title, hidden: false }}
                        isActive={!!isActive}
                        className={cn(
                          'px-2.5 md:px-2 cursor-pointer',
                          isActive ? 'border' : 'border-transparent'
                        )}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
