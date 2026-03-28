import { SidebarNav } from '@/components/sidebar-nav';
import { TopBar } from '@/components/top-bar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col bg-sidebar shadow-md">
        <div className="flex h-14 items-center px-4">
          <span className="text-base font-bold tracking-tight text-sidebar-foreground">
            Temar Admin
          </span>
        </div>
        <SidebarNav />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
