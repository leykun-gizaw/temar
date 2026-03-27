import { getLoggedInUser } from '@/lib/fetchers/users';
import { getAnalyticsData } from '@/lib/fetchers/analytics-stats';
import { AnalyticsShell } from './_components/analytics-shell';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const user = await getLoggedInUser();
  if (!user) redirect('/auth/login');

  const data = await getAnalyticsData(user.id);

  return (
    <div className="flex flex-col p-5 h-[calc(100svh-var(--header-height))] overflow-hidden">
      <div className="shrink-0 mb-4">
        <h1 className="text-4xl font-extrabold tracking-tight">Analytics</h1>
        <p className="text-lg text-muted-foreground mt-1">
          Deep insight into your learning journey.
        </p>
      </div>
      <AnalyticsShell data={data} />
    </div>
  );
}
