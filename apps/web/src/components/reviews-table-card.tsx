'use client';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { BinocularsIcon, DoorOpenIcon, Eye } from 'lucide-react';
import Link from 'next/link';
import { Input } from './ui/input';
import { useMemo, useState } from 'react';
import { CalendarEventParsed } from '@/lib/zod-schemas/calendar-schema';

export default function ReviewsTableCard({
  events,
}: {
  events: CalendarEventParsed[];
}) {
  const [search, setSearch] = useState('');

  const filteredReviews = useMemo(
    () =>
      events.filter((r) =>
        r.title.toLowerCase().includes(search.toLowerCase())
      ),
    [events, search]
  );

  return (
    <Card className="min-h-0 shadow-none">
      <CardHeader className="border-b">
        <CardTitle>Recall Items</CardTitle>
        <CardAction>
          <Button asChild variant={'outline'}>
            <Link href="/dashboard/reviews">
              <BinocularsIcon />
            </Link>
          </Button>
        </CardAction>
        <CardDescription>Recall items scheduled for this week</CardDescription>
        <div className="mt-2">
          <Input
            placeholder="Search recall items..."
            aria-label="Search reviews by title"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="overflow-auto min-h-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Items</TableHead>
              <TableHead>Reps </TableHead>
              <TableHead>Retrievability</TableHead>
              <TableHead>Due</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReviews.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-8"
                >
                  No reviews found
                </TableCell>
              </TableRow>
            )}
            {filteredReviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell className="font-medium">{review.title}</TableCell>
                <TableCell>{review.progress}</TableCell>
                <TableCell className="w-64">
                  <div className="flex items-center gap-2">
                    <Progress value={review.progress} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground w-10 text-right">
                      {review.progress}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {
                    <span className="text-xs text-muted-foreground">
                      {review.start.toLocaleString()}
                    </span>
                  }
                </TableCell>
                <TableCell className="flex gap-2 justify-end text-right">
                  <Button size="sm" variant="outline">
                    <Eye />
                  </Button>
                  <Button variant={'outline'} disabled>
                    <DoorOpenIcon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
