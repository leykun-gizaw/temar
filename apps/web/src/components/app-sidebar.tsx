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
} from '@/components/ui/sidebar';
import Link from 'next/link';
import Logo from '@/assets/logo';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { TopicsSidebarPanel } from '@/components/sidebar/topics-sidebar-panel';
import { SearchParamInput } from '@/components/sidebar/search-param-input';
import AddTopicDialog from '@/components/add-topic-dialog';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const activeItem =
    props.navMain.find((item) =>
      pathname?.startsWith(item.url.replace(/\/$/, ''))
    ) ?? props.navMain[0];

  // route -> panel registry (add more mappings as you grow)
  const panel = pathname?.startsWith('/dashboard/topics') ? (
    <TopicsSidebarPanel />
  ) : (
    props.sidebarContentData.map((mail) => (
      <a
        href="#"
        key={mail.email}
        className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0"
      >
        <div className="flex w-full items-center gap-2">
          <span>{mail.name}</span>{' '}
          <span className="ml-auto text-xs">{mail.date}</span>
        </div>
        <span className="font-medium">{mail.subject}</span>
        <span className="line-clamp-2 w-[260px] text-xs whitespace-break-spaces">
          {mail.teaser}
        </span>
      </a>
    ))
  );

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* First (icons) sidebar */}
      <Sidebar
        navMain={props.navMain}
        sidebarContentData={props.sidebarContentData}
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
                {props.navMain.map((item) => {
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

      {/* Second (content) sidebar */}
      <Sidebar
        navMain={props.navMain}
        sidebarContentData={props.sidebarContentData}
        collapsible="none"
        className="hidden flex-1 md:flex"
      >
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-foreground text-base font-medium">
              {activeItem?.title}
            </div>
            <div className="flex items-center gap-2">
              {/* New Topic button in the sidebar header */}
              <AddTopicDialog />
            </div>
          </div>
          {/* Search synced to ?query */}
          <SearchParamInput placeholder="Search topics..." />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>{panel}</SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
}
