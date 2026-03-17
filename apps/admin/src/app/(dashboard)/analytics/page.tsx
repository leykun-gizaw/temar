export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  fetchAnalyticsSummary,
  fetchTopModelsByUsage,
  fetchTopOperationsByUsage,
  fetchTopUsersByUsage,
  fetchModelCount,
} from './actions';

export default async function AnalyticsPage() {
  const [summary, topModels, topOperations, topUsers, modelCount] =
    await Promise.all([
      fetchAnalyticsSummary(),
      fetchTopModelsByUsage(),
      fetchTopOperationsByUsage(),
      fetchTopUsersByUsage(),
      fetchModelCount(),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Platform-wide AI usage overview
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
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

        <Card>
          <CardHeader className="pb-2">
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

        <Card>
          <CardHeader className="pb-2">
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

        <Card>
          <CardHeader className="pb-2">
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

        <Card>
          <CardHeader className="pb-2">
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

        <Card>
          <CardHeader className="pb-2">
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
    </div>
  );
}
