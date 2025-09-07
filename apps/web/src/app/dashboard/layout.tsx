'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import React from 'react';

import { navMain } from './dummy-nav-data';
import { QueryProvider } from '@/components/query-provider'; // added

// This is sample data
const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '',
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 90)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
      defaultOpen={true}
    >
      <QueryProvider>
        <AppSidebar navMain={navMain} />
        <SidebarInset>
          <SiteHeader userData={data.user} />
          {children}
        </SidebarInset>
      </QueryProvider>
    </SidebarProvider>
  );
}
