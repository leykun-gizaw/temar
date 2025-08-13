'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Minimal stub for HeaderStats until a real one exists
export function HeaderStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Reviews Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">12</div>
          <div className="text-xs text-muted-foreground">+3 from yesterday</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Active Topics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">8</div>
          <div className="text-xs text-muted-foreground">2 due this week</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Retention Avg</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">76%</div>
          <div className="text-xs text-muted-foreground">last 7 days</div>
        </CardContent>
      </Card>
    </div>
  );
}

export default HeaderStats;
