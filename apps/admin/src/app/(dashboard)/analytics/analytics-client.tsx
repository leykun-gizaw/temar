'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Input,
  Button,
} from '@temar/ui';
import {
  fetchAnalyticsSummary,
  fetchTopModelsByUsage,
  fetchTopOperationsByUsage,
  fetchTopUsersByUsage,
  fetchModelCount,
} from './actions';

type Summary = Awaited<ReturnType<typeof fetchAnalyticsSummary>>;
type TopModel = Awaited<ReturnType<typeof fetchTopModelsByUsage>>;
type TopOperation = Awaited<ReturnType<typeof fetchTopOperationsByUsage>>;
type TopUser = Awaited<ReturnType<typeof fetchTopUsersByUsage>>;
type ModelCount = Awaited<ReturnType<typeof fetchModelCount>>;

export default function AnalyticsClient() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [appliedFrom, setAppliedFrom] = useState('');
  const [appliedTo, setAppliedTo] = useState('');

  const [summary, setSummary] = useState<Summary | null>(null);
  const [topModels, setTopModels] = useState<TopModel>([]);
  const [topOperations, setTopOperations] = useState<TopOperation>([]);
  const [topUsers, setTopUsers] = useState<TopUser>([]);
  const [modelCount, setModelCount] = useState<ModelCount | null>(null);

  const [isPending, startTransition] = useTransition();

  const loadData = useCallback(
    (from: string, to: string) => {
      startTransition(async () => {
        const dateFromArg = from || undefined;
        const dateToArg = to || undefined;

        const [s, m, o, u, mc] = await Promise.all([
          fetchAnalyticsSummary(dateFromArg, dateToArg),
          fetchTopModelsByUsage(dateFromArg, dateToArg),
          fetchTopOperationsByUsage(dateFromArg, dateToArg),
          fetchTopUsersByUsage(dateFromArg, dateToArg),
          fetchModelCount(),
        ]);

        setSummary(s);
        setTopModels(m);
        setTopOperations(o);
        setTopUsers(u);
        setModelCount(mc);
      });
    },
    []
  );

  useEffect(() => {
    loadData('', '');
  }, [loadData]);

  function handleApply() {
    setAppliedFrom(dateFrom);
    setAppliedTo(dateTo);
    loadData(dateFrom, dateTo);
  }

  function handleClear() {
    setDateFrom('');
    setDateTo('');
    setAppliedFrom('');
    setAppliedTo('');
    loadData('', '');
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Platform-wide AI usage overview
        </p>
      </div>

      {/* Date Range Filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-muted-foreground">
          From:
        </label>
        <Input
          type="date"
          className="w-40"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <label className="text-sm font-medium text-muted-foreground">
          To:
        </label>
        <Input
          type="date"
          className="w-40"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
        <Button size="sm" onClick={handleApply} disabled={isPending}>
          Apply
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleClear}
          disabled={isPending}
        >
          Clear
        </Button>
        {isPending && (
          <span className="text-sm text-muted-foreground">Loading...</span>
        )}
        {!isPending && (appliedFrom || appliedTo) && (
          <span className="text-sm text-muted-foreground">
            Showing:{' '}
            {appliedFrom || 'all time'} &mdash; {appliedTo || 'now'}
          </span>
        )}
      </div>

      {/* Summary Cards */}
      {summary && modelCount ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="gap-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {summary.totalRequests.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="gap-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Cost (USD)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  ${summary.totalCostUsd.toFixed(4)}
                </p>
              </CardContent>
            </Card>

            <Card className="gap-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Unique Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {summary.uniqueUsers.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="gap-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Passes Charged
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {summary.totalPasses.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="gap-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Tokens (Input)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {summary.totalInputTokens.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="gap-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Models
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {modelCount.active}{' '}
                  <span className="text-sm font-normal text-muted-foreground">
                    / {modelCount.total}
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top 10 Tables */}
          <Tabs defaultValue="models">
            <TabsList>
              <TabsTrigger value="models">Top Models</TabsTrigger>
              <TabsTrigger value="operations">Top Operations</TabsTrigger>
              <TabsTrigger value="users">Top Users</TabsTrigger>
            </TabsList>

            <TabsContent value="models">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Requests</TableHead>
                    <TableHead>Total Cost (USD)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topModels.map((row, i) => (
                    <TableRow key={row.modelId}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {row.modelId}
                      </TableCell>
                      <TableCell>{row.requests.toLocaleString()}</TableCell>
                      <TableCell>${row.totalCost.toFixed(4)}</TableCell>
                    </TableRow>
                  ))}
                  {topModels.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground"
                      >
                        No data
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="operations">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Operation</TableHead>
                    <TableHead>Requests</TableHead>
                    <TableHead>Total Cost (USD)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topOperations.map((row, i) => (
                    <TableRow key={row.operationType}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{row.operationType}</TableCell>
                      <TableCell>{row.requests.toLocaleString()}</TableCell>
                      <TableCell>${row.totalCost.toFixed(4)}</TableCell>
                    </TableRow>
                  ))}
                  {topOperations.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground"
                      >
                        No data
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="users">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Requests</TableHead>
                    <TableHead>Total Cost (USD)</TableHead>
                    <TableHead>Passes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topUsers.map((row, i) => (
                    <TableRow key={row.userId}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="max-w-[200px] truncate font-mono text-xs">
                        {row.userId}
                      </TableCell>
                      <TableCell>{row.requests.toLocaleString()}</TableCell>
                      <TableCell>${row.totalCost.toFixed(4)}</TableCell>
                      <TableCell>{row.totalPasses.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {topUsers.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground"
                      >
                        No data
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Loading analytics...
        </div>
      )}
    </div>
  );
}
