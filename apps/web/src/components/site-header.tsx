import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { NavUser } from '@/components/nav-user';

export function SiteHeader({
  userData,
}: {
  userData: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  return (
    <header className="bg-background/70 sticky top-0 flex shrink-0 items-center gap-2 py-2 backdrop-blur-lg z-50 border-b">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Documents</h1>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <NavUser user={userData} />
        </div>
      </div>
    </header>
  );
}
