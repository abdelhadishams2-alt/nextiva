"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CannibalizationGroup as CannibalizationGroupType } from "@/lib/api";

interface CannibalizationGroupProps {
  group: CannibalizationGroupType;
  onResolve: (id: string, action: "merge" | "redirect" | "differentiate" | "deoptimize") => Promise<void>;
  className?: string;
}

const SEVERITY_CONFIG: Record<string, { variant: "destructive" | "default" | "outline"; label: string }> = {
  critical: { variant: "destructive", label: "Critical" },
  warning: { variant: "default", label: "Warning" },
  info: { variant: "outline", label: "Info" },
};

const RESOLUTION_ACTIONS = [
  { key: "merge" as const, label: "Merge", description: "Combine pages into one" },
  { key: "redirect" as const, label: "Redirect", description: "301 redirect weaker page" },
  { key: "differentiate" as const, label: "Differentiate", description: "Update content to target different intent" },
  { key: "deoptimize" as const, label: "Deoptimize", description: "Remove keyword targeting from weaker page" },
];

export function CannibalizationGroupCard({
  group,
  onResolve,
  className,
}: CannibalizationGroupProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const severityCfg = SEVERITY_CONFIG[group.severity] || SEVERITY_CONFIG.info;

  async function handleResolve(action: "merge" | "redirect" | "differentiate" | "deoptimize") {
    setLoading(action);
    try {
      await onResolve(group.id, action);
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card className={cn(group.resolved && "opacity-60", className)}>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={severityCfg.variant}>{severityCfg.label}</Badge>
          <h4 className="text-sm font-medium flex-1 min-w-0">
            Keyword: <span className="font-semibold">{group.keyword}</span>
          </h4>
          <Badge variant="secondary">{group.pages.length} pages</Badge>
          {group.resolved && (
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
              Resolved
            </Badge>
          )}
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead className="text-end">Position</TableHead>
                <TableHead className="text-end hidden sm:table-cell">Impressions</TableHead>
                <TableHead className="text-end hidden sm:table-cell">Clicks</TableHead>
                <TableHead className="text-end hidden md:table-cell">CTR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.pages.map((page, i) => (
                <TableRow key={i}>
                  <TableCell className="max-w-[250px]">
                    <div className="truncate text-xs" title={page.url}>
                      {page.title || page.url}
                    </div>
                    <div className="truncate text-xs text-muted-foreground" title={page.url}>
                      {page.url}
                    </div>
                  </TableCell>
                  <TableCell className="text-end tabular-nums">
                    {page.position.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-end tabular-nums hidden sm:table-cell">
                    {page.impressions.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-end tabular-nums hidden sm:table-cell">
                    {page.clicks.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-end tabular-nums hidden md:table-cell">
                    {(page.ctr * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {!group.resolved && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Recommended:</span>
              <Badge variant="secondary" className="capitalize">
                {group.recommended_action}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="ms-auto text-xs"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "Hide actions" : "Show all actions"}
              </Button>
            </div>

            {expanded ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {RESOLUTION_ACTIONS.map((action) => (
                  <Button
                    key={action.key}
                    size="sm"
                    variant={action.key === group.recommended_action ? "default" : "outline"}
                    onClick={() => handleResolve(action.key)}
                    disabled={loading !== null}
                    className="flex flex-col h-auto py-2"
                  >
                    <span className="text-xs font-medium">
                      {loading === action.key ? "..." : action.label}
                    </span>
                    <span className="text-[10px] opacity-70 font-normal">
                      {action.description}
                    </span>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleResolve(group.recommended_action)}
                  disabled={loading !== null}
                >
                  {loading === group.recommended_action
                    ? "Resolving..."
                    : `Apply: ${group.recommended_action}`}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function CannibalizationGroupSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}
