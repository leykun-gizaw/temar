import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CalendarDaysIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';

export default async function ScheduleCard({
  children,
  dueCount = 0,
}: {
  children: React.ReactNode;
  dueCount?: number;
}) {
  return (
    <Card className="flex flex-col h-full min-h-0 w-full overflow-hidden shadow-none">
      <CardHeader>
        <CardTitle>Reviews Schedule</CardTitle>
        <CardDescription>
          {dueCount > 0
            ? `${dueCount} review${dueCount !== 1 ? 's' : ''} due`
            : 'No reviews due'}
        </CardDescription>
        <CardAction>
          <Button variant={'outline'} asChild>
            <Link href={'/dashboard/reviews'}>
              <CalendarDaysIcon />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0 flex-1 h-full min-h-0">
        {children}
      </CardContent>
    </Card>
  );
}
