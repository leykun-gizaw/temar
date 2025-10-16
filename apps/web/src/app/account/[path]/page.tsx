import SiteNavbar from '@/components/site-navbar';
import { AccountView } from '@daveyplate/better-auth-ui';
import { accountViewPaths } from '@daveyplate/better-auth-ui/server';

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(accountViewPaths).map((path) => ({ path }));
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  return (
    <main className="flex flex-col items-center gap-8">
      <SiteNavbar />
      <div className="w-2/3">
        <AccountView path={path} />
      </div>
    </main>
  );
}
