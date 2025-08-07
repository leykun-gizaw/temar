import { AppSidebar } from '@/components/app-sidebar';
import { DataTable } from '@/components/data-table';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import data from './data.json';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Page() {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 90)',
          // '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-6 flex flex-col gap-2">
                <h1 className="text-2xl font-bold">Topics</h1>
              </div>
              <div className="px-6">
                {/* <Input type="text" placeholder="Search topic notes" />
                <Button></Button> */}
                <DataTable data={data} />
              </div>
              {/* <SectionCards /> */}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
