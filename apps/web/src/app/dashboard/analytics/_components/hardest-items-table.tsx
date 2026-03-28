'use client';

import { AlertTriangle } from 'lucide-react';
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@temar/ui';

interface HardestItemsTableProps {
  data: Array<{
    id: string;
    questionTitle: string | null;
    chunkName: string;
    topicName: string;
    noteName: string;
    difficulty: number;
    lapses: number;
    stability: number;
    reps: number;
  }>;
}

export function HardestItemsTable({ data }: HardestItemsTableProps) {
  const isEmpty = !data || data.length === 0;

  return (
    <Card className="bg-card rounded-2xl p-5 flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center gap-1.5 shrink-0">
        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Hardest Items</span>
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
          No items yet — track some content to see analytics
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead>Topic &gt; Note</TableHead>
              <TableHead className="text-right">Difficulty</TableHead>
              <TableHead className="text-right">Lapses</TableHead>
              <TableHead className="text-right">Stability</TableHead>
              <TableHead className="text-right">Reviews</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 20).map((item) => (
              <TableRow key={item.id} className="hover:bg-background/50">
                <TableCell className="max-w-[250px] truncate">
                  {item.questionTitle ? (
                    item.questionTitle
                  ) : (
                    <span className="text-muted-foreground">
                      {item.chunkName}
                    </span>
                  )}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                  {item.topicName} &gt; {item.noteName}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.difficulty.toFixed(1)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.lapses}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.stability.toFixed(1)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.reps}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      )}
    </Card>
  );
}
