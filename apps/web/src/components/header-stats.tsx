'use client';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BinocularsIcon, LibraryBigIcon } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';

// Minimal stub for HeaderStats until a real one exists
export function HeaderStats() {
  return (
    <div className="flex gap-6">
      <Card className="w-full gap-1">
        <CardHeader>
          <CardTitle className="flex justify-between">
            Reviews Today
            <Button variant={'outline'} className="w-fit">
              <Link href="/dashboard/reviews">
                <BinocularsIcon />
              </Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-normal">12</div>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">+3 from yesterday</div>
        </CardFooter>
      </Card>
      <Card className="w-full gap-0">
        <CardHeader>
          <CardTitle className="flex justify-between">
            Topics this week
            <Button variant={'outline'} className="w-fit">
              <Link href="/dashboard/reviews">
                <LibraryBigIcon />
              </Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-normal">4</div>
          <div className="text-xs text-muted-foreground">3 due today</div>
        </CardContent>
      </Card>
    </div>
  );
}

export default HeaderStats;
