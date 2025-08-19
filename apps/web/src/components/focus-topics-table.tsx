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
import { calendar_events } from '@/app/dashboard/dummy-calendar-events-data';
import { Input } from './ui/input';
import { useMemo, useState } from 'react';

export default function ReviewsTableCard() {
  const [search, setSearch] = useState('');

  const filteredReviews = useMemo(
    () =>
      calendar_events.filter((r) =>
        r.title.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );

  return (
    <Card className="min-h-0">
      <CardHeader className="border-b">
        <CardTitle>Reviews List</CardTitle>
        <CardAction>
          <Button asChild variant={'outline'}>
            <Link href="/dashboard/reviews">
              <BinocularsIcon />
            </Link>
          </Button>
        </CardAction>
        <CardDescription>Review chunks scheduled for this week</CardDescription>
        <div className="mt-2">
          <Input
            placeholder="Search reviews..."
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
              <TableHead>Reviews</TableHead>
              <TableHead>Repetitions Count</TableHead>
              <TableHead>Retention</TableHead>
              <TableHead></TableHead>
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
                <TableCell>{Math.floor(Math.random() * 5)}</TableCell>
                <TableCell className="w-64">
                  <div className="flex items-center gap-2">
                    <Progress value={review.progress} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground w-10 text-right">
                      {review.progress}%
                    </span>
                  </div>
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
