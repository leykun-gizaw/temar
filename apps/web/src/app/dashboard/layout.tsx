import { AppSidebar } from './_components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import React from 'react';
import { RedirectToSignIn, SignedIn } from '@daveyplate/better-auth-ui';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <RedirectToSignIn />
      <SignedIn>
        <SidebarProvider
          style={
            {
              '--sidebar-width': 'calc(var(--spacing) * 90)',
              '--header-height': 'calc(var(--spacing) * 12)',
            } as React.CSSProperties
          }
          defaultOpen={true}
        >
          <AppSidebar />
          <SidebarInset>
            <SiteHeader />
            {children}
          </SidebarInset>
        </SidebarProvider>
      </SignedIn>
    </>
  );
}
