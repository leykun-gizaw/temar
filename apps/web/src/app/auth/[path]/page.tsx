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
    <main className="h-full">
      <SiteNavbar />
      <div className="h-full flex flex-col justify-center items-center">
        <AuthView path={path} />
        <SiteFooter className="fixed bottom-0" />
      </div>
    </main>
  );
}
