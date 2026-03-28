'use client';

import { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Button,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@temar/ui';
import { AlertTriangle } from 'lucide-react';
import { ModelToggle } from './model-toggle';

interface Model {
  id: string;
  provider: string;
  label: string;
  providerModelId: string | null;
  isActive: boolean;
  createdAt: Date;
}

interface ModelsTableProps {
  models: Model[];
  warnings: Record<string, string[]>;
}

type StatusFilter = 'all' | 'active' | 'inactive';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

function generatePageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [1];
  if (current > 3) pages.push('ellipsis');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('ellipsis');
  if (total > 1) pages.push(total);
  return pages;
}

export function ModelsTable({ models, warnings }: ModelsTableProps) {
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const providers = useMemo(() => {
    const unique = Array.from(new Set(models.map((m) => m.provider))).sort();
    return unique;
  }, [models]);

  const providerCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of models) {
      counts[m.provider] = (counts[m.provider] || 0) + 1;
    }
    return counts;
  }, [models]);

  const statusCounts = useMemo(() => {
    const base =
      providerFilter === 'all'
        ? models
        : models.filter((m) => m.provider === providerFilter);
    return {
      all: base.length,
      active: base.filter((m) => m.isActive).length,
      inactive: base.filter((m) => !m.isActive).length,
    };
  }, [models, providerFilter]);

  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      if (providerFilter !== 'all' && m.provider !== providerFilter) {
        return false;
      }
      if (statusFilter === 'active' && !m.isActive) return false;
      if (statusFilter === 'inactive' && m.isActive) return false;
      return true;
    });
  }, [models, providerFilter, statusFilter]);

  const totalPages = Math.ceil(filteredModels.length / pageSize);

  const paginatedModels = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredModels.slice(start, start + pageSize);
  }, [filteredModels, currentPage, pageSize]);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Provider filter */}
        <div className="flex items-center gap-1">
          <span className="mr-1 text-xs font-medium text-muted-foreground">
            Provider:
          </span>
          <Button
            variant={providerFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            className="text-xs"
            onClick={() => { setProviderFilter('all'); setCurrentPage(1); }}
          >
            All ({models.length})
          </Button>
          {providers.map((provider) => (
            <Button
              key={provider}
              variant={providerFilter === provider ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
              onClick={() => { setProviderFilter(provider); setCurrentPage(1); }}
            >
              <span className="capitalize">{provider}</span> (
              {providerCounts[provider]})
            </Button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1">
          <span className="mr-1 text-xs font-medium text-muted-foreground">
            Status:
          </span>
          {(
            [
              { label: 'All', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ] as const
          ).map((f) => (
            <Button
              key={f.value}
              variant={statusFilter === f.value ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
              onClick={() => { setStatusFilter(f.value); setCurrentPage(1); }}
            >
              {f.label} ({statusCounts[f.value]})
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Model ID</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Display Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedModels.map((model) => (
            <TableRow key={model.id}>
              <TableCell className="font-mono text-sm">{model.id}</TableCell>
              <TableCell className="capitalize">{model.provider}</TableCell>
              <TableCell>{model.label}</TableCell>
              <TableCell>
                <Badge variant={model.isActive ? 'default' : 'secondary'}>
                  {model.isActive ? 'Active' : 'Inactive'}
                </Badge>
                {warnings[model.id] && (
                  <div className="mt-1 flex items-start gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                    <span className="text-xs text-destructive">
                      {warnings[model.id].join(', ')}
                    </span>
                  </div>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {model.createdAt
                  ? new Date(model.createdAt).toLocaleDateString()
                  : '—'}
              </TableCell>
              <TableCell>
                <ModelToggle
                  modelId={model.id}
                  initialActive={model.isActive}
                />
              </TableCell>
            </TableRow>
          ))}
          {paginatedModels.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                {models.length === 0
                  ? 'No models registered'
                  : 'No models match the current filters'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {filteredModels.length > 0 && (
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} ({filteredModels.length} items)
            </p>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}
            >
              <SelectTrigger className="h-8 w-[110px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {generatePageNumbers(currentPage, totalPages).map((pageNum, i) =>
                pageNum === 'ellipsis' ? (
                  <PaginationItem key={`e-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      isActive={pageNum === currentPage}
                      onClick={() => setCurrentPage(pageNum)}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
