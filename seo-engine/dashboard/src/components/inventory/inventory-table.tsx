"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { InventoryItem, InventoryParams } from "@/lib/api";

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  healthy: "default",
  needs_review: "secondary",
  thin: "outline",
  error: "destructive",
  new: "secondary",
};

interface Column {
  key: string;
  label: string;
  sortable: boolean;
  className?: string;
}

const COLUMNS: Column[] = [
  { key: "url", label: "URL", sortable: true, className: "min-w-[200px]" },
  { key: "title", label: "Title", sortable: true, className: "min-w-[150px]" },
  { key: "status", label: "Status", sortable: true },
  { key: "word_count", label: "Words", sortable: true },
  { key: "h2_count", label: "H2s", sortable: true },
  { key: "internal_links", label: "Links", sortable: true },
  { key: "images", label: "Images", sortable: true },
  { key: "health_score", label: "Health", sortable: true },
  { key: "last_crawled", label: "Last Crawled", sortable: true },
];

interface InventoryTableProps {
  items: InventoryItem[];
  loading: boolean;
  total: number;
  page: number;
  perPage: number;
  sort: string;
  order: "asc" | "desc";
  onSort: (column: string) => void;
  onPageChange: (page: number) => void;
  onRowClick: (id: string) => void;
  filters: InventoryParams;
}

function SortIcon({
  active,
  direction,
}: {
  active: boolean;
  direction: "asc" | "desc";
}) {
  if (!active) {
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="ms-1 opacity-30"
      >
        <path d="M7 15l5 5 5-5" />
        <path d="M7 9l5-5 5 5" />
      </svg>
    );
  }
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="ms-1"
    >
      {direction === "asc" ? (
        <path d="M7 14l5-5 5 5" />
      ) : (
        <path d="M7 10l5 5 5-5" />
      )}
    </svg>
  );
}

export function InventoryTable({
  items,
  loading,
  total,
  page,
  perPage,
  sort,
  order,
  onSort,
  onPageChange,
  onRowClick,
}: InventoryTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function truncateUrl(url: string, maxLen: number = 50): string {
    try {
      const parsed = new URL(url);
      const path = parsed.pathname + parsed.search;
      if (path.length > maxLen) return path.slice(0, maxLen) + "...";
      return path;
    } catch {
      if (url.length > maxLen) return url.slice(0, maxLen) + "...";
      return url;
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-6 w-[70px] rounded-full" />
            <Skeleton className="h-4 w-[50px]" />
            <Skeleton className="h-4 w-[30px]" />
            <Skeleton className="h-4 w-[30px]" />
            <Skeleton className="h-4 w-[30px]" />
            <Skeleton className="h-4 w-[50px]" />
            <Skeleton className="h-4 w-[80px]" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    col.sortable && "cursor-pointer select-none hover:bg-accent/50",
                    col.className
                  )}
                  onClick={() => col.sortable && onSort(col.key)}
                >
                  <div className="flex items-center">
                    {col.label}
                    {col.sortable && (
                      <SortIcon
                        active={sort === col.key}
                        direction={sort === col.key ? order : "asc"}
                      />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow
                key={item.id}
                className="cursor-pointer hover:bg-accent/50"
                onClick={() => onRowClick(item.id)}
              >
                <TableCell className="font-mono text-xs" title={item.url}>
                  {truncateUrl(item.url)}
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={item.title}>
                  {item.title || "-"}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[item.status] ?? "outline"}>
                    {item.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-end tabular-nums">
                  {item.word_count.toLocaleString()}
                </TableCell>
                <TableCell className="text-end tabular-nums">
                  {item.h2_count}
                </TableCell>
                <TableCell className="text-end tabular-nums">
                  {item.internal_links}
                </TableCell>
                <TableCell className="text-end tabular-nums">
                  {item.images}
                </TableCell>
                <TableCell className="text-end tabular-nums">
                  <span
                    className={cn(
                      "font-medium",
                      item.health_score >= 80
                        ? "text-green-600 dark:text-green-400"
                        : item.health_score >= 50
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-red-600 dark:text-red-400"
                    )}
                  >
                    {item.health_score}
                  </span>
                </TableCell>
                <TableCell className="text-end whitespace-nowrap text-muted-foreground text-xs">
                  {formatDate(item.last_crawled)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {(page - 1) * perPage + 1}
          {" - "}
          {Math.min(page * perPage, total)} of {total.toLocaleString()} URLs
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
