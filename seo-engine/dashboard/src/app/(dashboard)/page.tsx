"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  fetchAnalyticsOverview,
  fetchArticles,
  fetchPipelineStatus,
  fetchPipelineHistory,
  type Article,
  type PipelineJob,
  type AnalyticsOverview,
} from "@/lib/api";

function KPICard({
  title,
  value,
  loading,
}: {
  title: string;
  value: string | number | null;
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
          <Skeleton className="h-8 w-20" />
        ) : (
          <p className="text-2xl font-bold">{value ?? "—"}</p>
        )}
      </CardContent>
    </Card>
  );
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  completed: "default",
  running: "secondary",
  queued: "outline",
  failed: "destructive",
  draft: "outline",
  published: "default",
  generating: "secondary",
  cancelled: "destructive",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] || "outline"}>
      {status}
    </Badge>
  );
}

export default function DashboardHome() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<string>("idle");
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [recentJobs, setRecentJobs] = useState<PipelineJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [analyticsRes, statusRes, articlesRes, jobsRes] =
          await Promise.all([
            fetchAnalyticsOverview().catch(() => null),
            fetchPipelineStatus().catch(() => null),
            fetchArticles({ limit: "5" }).catch(() => null),
            fetchPipelineHistory({ limit: "5" }).catch(() => null),
          ]);

        if (analyticsRes?.success) setOverview(analyticsRes.data);
        if (statusRes?.success) setPipelineStatus(statusRes.data.status);
        if (articlesRes?.success) setRecentArticles(articlesRes.data);
        if (jobsRes?.success) setRecentJobs(jobsRes.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Articles Generated"
          value={overview?.total_articles ?? null}
          loading={loading}
        />
        <KPICard
          title="Pipeline Jobs"
          value={overview?.total_jobs ?? null}
          loading={loading}
        />
        <KPICard
          title="Edits Today"
          value={overview?.edits_today ?? null}
          loading={loading}
        />
        <KPICard
          title="Pipeline"
          value={pipelineStatus}
          loading={loading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Recent Articles
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentArticles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No articles yet. Generate your first article to see it here.
              </p>
            ) : (
              <div className="space-y-3">
                {recentArticles.map((article) => (
                  <div
                    key={article.id}
                    className="flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {article.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {article.topic} &middot;{" "}
                        {new Date(article.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={article.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Pipeline Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : recentJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pipeline jobs yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {job.topic}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(job.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
