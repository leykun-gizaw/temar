'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { topics_data } from '@/app/dashboard/dummy-topics-data';

export function FocusTopicsTable() {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Reviews List</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Topic</TableHead>
              <TableHead>Retention</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topics_data.map((topic) => (
              <TableRow key={topic.id}>
                <TableCell className="font-medium">{topic.title}</TableCell>
                <TableCell className="w-64">
                  <div className="flex items-center gap-2">
                    <Progress value={topic.progress} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground w-10 text-right">
                      {topic.progress}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline">
                    Review Now
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

export default FocusTopicsTable;
