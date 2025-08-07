'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronDown, MoreHorizontal } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export type Note = {
  id: string;
  title: string;
  content: string;
};

export type Topic = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  tags: string[];
  color?: string;
  createdAt: string;
  updatedAt: string;
  notes: Note[];
};

export const columns: ColumnDef<Topic>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const topic = row.original;
      return (
        <Drawer direction="right">
          <DrawerTrigger asChild>
            <Button variant="link" className="capitalize p-0 h-auto">
              {topic.title}
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{topic.title}</DrawerTitle>
              <DrawerDescription>{topic.description}</DrawerDescription>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
      );
    },
  },
  {
    accessorKey: 'tags',
    header: 'Tags',
    cell: ({ row }) => {
      const tags = row.getValue('tags') as string[];
      return (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const rowTags = row.getValue(id) as string[];
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return true;
      }
      return (value as string[]).some((tag) => rowTags.includes(tag));
    },
  },
  {
    accessorKey: 'notes',
    header: 'Number of Notes',
    cell: ({ row }) => {
      const notes = row.getValue('notes') as Note[];
      return <div>{notes?.length ?? 0}</div>;
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const topic = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(topic.id)}
            >
              Copy Topic ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View Topic</DropdownMenuItem>
            <DropdownMenuItem>Edit Topic</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function DataTable({ data }: { data: Topic[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const tags = React.useMemo(() => {
    const allTags = data.flatMap((topic) => topic.tags);
    return [...new Set(allTags)];
  }, [data]);

  const selectedTagsFilter = table.getColumn('tags')?.getFilterValue();

  React.useEffect(() => {
    const tagsColumn = table.getColumn('tags');
    if (tagsColumn && Array.isArray(selectedTagsFilter) && selectedTagsFilter.length === 0) {
      tagsColumn.setFilterValue(undefined);
    }
  }, [selectedTagsFilter, table]);

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter titles..."
          value={(table.getColumn('title')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('title')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <ChevronDown className="mr-2 h-4 w-4" />
                Filter by Tag
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Tag</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {tags.map((tag) => {
                const tagsColumn = table.getColumn('tags');
                const selectedTags = (tagsColumn?.getFilterValue() as string[]) ?? [];
                return (
                  <DropdownMenuCheckboxItem
                    key={tag}
                    checked={selectedTags.includes(tag)}
                    onCheckedChange={(checked) => {
                      if (!tagsColumn) return;
                      const currentTags = selectedTags;
                      let newTags: string[];
                      if (checked) {
                        newTags = [...currentTags, tag];
                      } else {
                        newTags = currentTags.filter((t) => t !== tag);
                      }
                      tagsColumn.setFilterValue(newTags.length > 0 ? newTags : undefined);
                    }}
                  >
                    {tag}
                  </DropdownMenuCheckboxItem>
                );
              })}
              {(() => {
                const tagsColumn = table.getColumn('tags');
                if (!tagsColumn) return null;
                const selectedTags = (tagsColumn.getFilterValue() as string[] | undefined) ?? [];
                if (selectedTags.length > 0) {
                  return (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => tagsColumn.setFilterValue(undefined)}
                        className="justify-center text-center"
                      >
                        Clear filters
                      </DropdownMenuItem>
                    </>
                  );
                }
                return null;
              })()}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button>Add Topic</Button>
        </div>
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-sidebar">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No Topics.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
