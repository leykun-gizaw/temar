import SiteFooter from '@/components/site-footer';
import SiteNavbar from '@/components/site-navbar';
import { AuthView } from './auth-view-wrapper';
import { authViewPaths } from '@daveyplate/better-auth-ui/server';

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(authViewPaths).map((path) => ({ path }));
}

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteNavbar />
      <main className="flex flex-1 flex-col items-center justify-center">
        <AuthView path={path} />
      </main>
      <SiteFooter />
    </div>
  );
}
