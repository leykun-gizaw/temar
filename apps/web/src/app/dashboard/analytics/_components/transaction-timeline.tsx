'use client';

import { Receipt } from 'lucide-react';
import {
  Card,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from '@temar/ui';

interface TransactionTimelineProps {
  data: Array<{
    id: string;
    date: string;
    deltaPasses: number;
    operationType: string;
    description: string;
  }>;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function TransactionTimeline({ data }: TransactionTimelineProps) {
  const isEmpty = !data || data.length === 0;

  return (
    <Card className="bg-card rounded-2xl p-5 flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center gap-1.5 mb-2 shrink-0">
        <Receipt className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Recent Transactions</span>
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
          No transactions yet
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Passes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((tx) => (
                <TableRow key={tx.id} className="hover:bg-background/50">
                  <TableCell className="text-muted-foreground tabular-nums">
                    {formatDate(tx.date)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{tx.operationType}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[250px] truncate">
                    {tx.description}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right tabular-nums font-medium',
                      tx.deltaPasses >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {tx.deltaPasses >= 0 ? '+' : ''}{tx.deltaPasses.toLocaleString()}
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
