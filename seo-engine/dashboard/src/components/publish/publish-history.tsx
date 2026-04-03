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
import type { PublishRecord } from "@/lib/api";
import { getPlatformMeta } from "./platform-card";

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  published: "default",
  publishing: "secondary",
  pending: "outline",
  failed: "destructive",
};

interface PublishHistoryProps {
  records: PublishRecord[];
  loading: boolean;
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PublishHistory({
  records,
  loading,
  total,
  page,
  totalPages,
  onPageChange,
}: PublishHistoryProps) {
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Article</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Published URL</TableHead>
            <TableHead className="hidden sm:table-cell">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                </TableRow>
              ))
            : records.length === 0
              ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No publish history yet. Publish your first article to get
                      started.
                    </TableCell>
                  </TableRow>
                )
              : records.map((record) => {
                  const meta = getPlatformMeta(record.platform);
                  return (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {record.article_title}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold text-white",
                              meta.color
                            )}
                          >
                            {meta.icon}
                          </span>
                          <span className="text-sm">{record.platform_label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={STATUS_VARIANT[record.status] || "outline"}
                        >
                          {record.status}
                        </Badge>
                        {record.error_message && (
                          <p className="text-xs text-destructive mt-1 max-w-[200px] truncate">
                            {record.error_message}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {record.published_url ? (
                          <a
                            href={record.published_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline truncate max-w-[200px] inline-block"
                          >
                            {record.published_url}
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            --
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                        {record.published_at
                          ? new Date(record.published_at).toLocaleDateString()
                          : record.created_at
                            ? new Date(record.created_at).toLocaleDateString()
                            : "--"}
                      </TableCell>
                    </TableRow>
                  );
                })}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
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
      )}
    </div>
  );
}
