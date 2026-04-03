"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PortfolioSummary } from "@/lib/api";

interface PortfolioSummaryCardsProps {
  data: PortfolioSummary | null;
  loading: boolean;
}

function MetricCard({
  title,
  value,
  subtitle,
  loading,
}: {
  title: string;
  value: string | number | null;
  subtitle?: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-1">
            <Skeleton className="h-8 w-20" />
            {subtitle !== undefined && <Skeleton className="h-3 w-28" />}
          </div>
        ) : (
          <div>
            <p className="text-2xl font-bold">{value ?? "\u2014"}</p>
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PortfolioSummaryCards({ data, loading }: PortfolioSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Articles"
        value={data?.total_articles ?? null}
        loading={loading}
      />
      <MetricCard
        title="Avg Performance"
        value={data ? `${data.avg_performance_score.toFixed(1)}%` : null}
        loading={loading}
      />
      <MetricCard
        title="Top Performer"
        value={data?.top_performer?.title ?? "\u2014"}
        subtitle={
          data?.top_performer
            ? `Score: ${data.top_performer.score.toFixed(1)}%`
            : undefined
        }
        loading={loading}
      />
      <MetricCard
        title="Total Clicks"
        value={data ? data.total_clicks.toLocaleString() : null}
        subtitle={
          data
            ? `${data.total_impressions.toLocaleString()} impressions`
            : undefined
        }
        loading={loading}
      />
    </div>
  );
}
