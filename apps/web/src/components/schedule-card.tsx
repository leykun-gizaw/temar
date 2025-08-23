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
}: {
  children: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col h-full min-h-0 w-full lg:w-2xl md:w-full">
      <CardHeader>
        <CardTitle>Reviews Schedule</CardTitle>
        <CardDescription>5 Reviews scheduled for today</CardDescription>
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
