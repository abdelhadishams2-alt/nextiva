"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { ArticlePerformance, MilestoneStatus } from "@/lib/api";

const MILESTONE_VARIANT: Record<
  MilestoneStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  achieved: "default",
  on_track: "secondary",
  pending: "outline",
  at_risk: "destructive",
  missed: "destructive",
};

function MilestoneBadge({
  label,
  status,
  target,
  actual,
}: {
  label: string;
  status: MilestoneStatus;
  target: number;
  actual: number | null;
}) {
  const displayValue = actual !== null ? actual : "\u2014";
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-medium text-muted-foreground uppercase">
        {label}
      </span>
      <Badge variant={MILESTONE_VARIANT[status]} className="text-xs">
        {status}
      </Badge>
      <span className="text-[10px] text-muted-foreground">
        {displayValue}/{target}
      </span>
    </div>
  );
}

interface ArticleTrackerProps {
  articles: ArticlePerformance[];
  loading: boolean;
}

export function ArticleTracker({ articles, loading }: ArticleTrackerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Article Performance Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No published articles to track yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Article</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-center">Clicks</TableHead>
                  <TableHead className="text-center">Position</TableHead>
                  <TableHead className="text-center">30-Day</TableHead>
                  <TableHead className="text-center">60-Day</TableHead>
                  <TableHead className="text-center">90-Day</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article) => (
                  <TableRow key={article.article_id}>
                    <TableCell>
                      <div className="min-w-0 max-w-[200px]">
                        <p className="truncate text-sm font-medium">
                          {article.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(article.published_at).toLocaleDateString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-semibold">
                        {article.performance_score.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {article.current_clicks.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {article.current_position.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-center">
                      <MilestoneBadge
                        label="30d"
                        status={article.milestone_30.status}
                        target={article.milestone_30.target}
                        actual={article.milestone_30.actual}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <MilestoneBadge
                        label="60d"
                        status={article.milestone_60.status}
                        target={article.milestone_60.target}
                        actual={article.milestone_60.actual}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <MilestoneBadge
                        label="90d"
                        status={article.milestone_90.status}
                        target={article.milestone_90.target}
                        actual={article.milestone_90.actual}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
