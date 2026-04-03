"use client";

import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScoreBadge } from "./score-badge";
import type { KeywordGap } from "@/lib/api";

interface GapTableProps {
  gaps: KeywordGap[];
  loading?: boolean;
  sort?: string;
  order?: "asc" | "desc";
  onSort?: (column: string) => void;
  className?: string;
}

interface ColumnDef {
  key: string;
  label: string;
  sortable: boolean;
  align?: "start" | "end";
  className?: string;
}

const COLUMNS: ColumnDef[] = [
  { key: "keyword", label: "Keyword", sortable: true },
  { key: "search_volume", label: "Volume", sortable: true, align: "end" },
  { key: "difficulty", label: "Difficulty", sortable: true, align: "end" },
  { key: "current_position", label: "Your Position", sortable: true, align: "end" },
  { key: "competitor_position", label: "Competitor", sortable: true, align: "end" },
  { key: "impressions", label: "Impressions", sortable: true, align: "end" },
  { key: "clicks", label: "Clicks", sortable: true, align: "end" },
  { key: "opportunity_score", label: "Score", sortable: true, align: "end" },
];

function SortIcon({ active, direction }: { active: boolean; direction: "asc" | "desc" }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={cn(
        "inline-block ms-1 transition-transform",
        !active && "opacity-30",
        active && direction === "asc" && "rotate-180"
      )}
    >
      <path d="M6 9L2 4h8L6 9z" fill="currentColor" />
    </svg>
  );
}

export function GapTable({
  gaps,
  loading,
  sort,
  order = "desc",
  onSort,
  className,
}: GapTableProps) {
  if (!loading && gaps.length === 0) {
    return (
      <div className={cn("py-12 text-center text-sm text-muted-foreground", className)}>
        No keyword gaps found. Run an analysis to discover opportunities.
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((col) => (
              <TableHead
                key={col.key}
                className={cn(
                  col.sortable && "cursor-pointer select-none hover:text-foreground",
                  col.align === "end" && "text-end"
                )}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                {col.label}
                {col.sortable && (
                  <SortIcon active={sort === col.key} direction={order} />
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {COLUMNS.map((col) => (
                    <TableCell key={col.key}>
                      <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : gaps.map((gap) => (
                <TableRow key={gap.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {gap.keyword}
                  </TableCell>
                  <TableCell className="text-end tabular-nums">
                    {gap.search_volume.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-end tabular-nums">
                    {gap.difficulty}
                  </TableCell>
                  <TableCell className="text-end tabular-nums">
                    {gap.current_position !== null ? gap.current_position.toFixed(1) : "---"}
                  </TableCell>
                  <TableCell className="text-end tabular-nums">
                    {gap.competitor_position !== null ? gap.competitor_position.toFixed(1) : "---"}
                  </TableCell>
                  <TableCell className="text-end tabular-nums">
                    {gap.impressions.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-end tabular-nums">
                    {gap.clicks.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-end">
                    <ScoreBadge score={gap.opportunity_score} size="sm" />
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}
