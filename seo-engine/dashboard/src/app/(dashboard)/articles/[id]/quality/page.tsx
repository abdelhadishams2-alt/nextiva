"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreRing, ScoreRingSkeleton } from "@/components/quality/score-ring";
import { SignalBars, SignalBarsSkeleton } from "@/components/quality/signal-bars";
import { ChecklistPanel, ChecklistPanelSkeleton } from "@/components/quality/checklist-panel";
import {
  fetchArticle,
  fetchQualityReport,
  refreshQualityReport,
  triggerAutoFix,
  type Article,
  type QualityReport,
} from "@/lib/api";

export default function QualityPage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [report, setReport] = useState<QualityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rescoring, setRescoring] = useState(false);
  const [fixing, setFixing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [articleRes, reportRes] = await Promise.all([
        fetchArticle(articleId).catch(() => null),
        fetchQualityReport(articleId).catch(() => null),
      ]);
      if (articleRes?.success) {
        setArticle(articleRes.data);
      } else {
        setError("Article not found or inaccessible.");
        return;
      }
      if (reportRes?.success) {
        setReport(reportRes.data);
      }
    } catch {
      setError("Failed to load quality report.");
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRescore = async () => {
    setRescoring(true);
    try {
      const res = await refreshQualityReport(articleId);
      if (res.success) {
        setReport(res.data);
      }
    } catch {
      // Ignore — user can retry
    } finally {
      setRescoring(false);
    }
  };

  const handleAutoFix = async () => {
    setFixing(true);
    try {
      await triggerAutoFix(articleId);
      // Reload report after auto-fix triggers
      setTimeout(() => {
        loadData();
        setFixing(false);
      }, 2000);
    } catch {
      setFixing(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 sm:flex-row lg:flex-col">
              <ScoreRingSkeleton />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="h-5 w-32 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <SignalBarsSkeleton />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardContent>
            <ChecklistPanelSkeleton />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !article) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Quality Report</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {error || "This article could not be found. It may have been deleted or you may not have access."}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/articles")}
            >
              Back to Articles
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No report yet
  if (!report) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Quality Report</h1>
          <Button onClick={handleRescore} disabled={rescoring}>
            {rescoring ? "Scoring\u2026" : "Score Now"}
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No quality report available for &ldquo;{article.title}&rdquo;. Click &ldquo;Score Now&rdquo; to generate one.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight">
            Quality Report
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {article.title} &middot; Scored{" "}
            {new Date(report.scored_at).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRescore} disabled={rescoring}>
            {rescoring ? "Scoring\u2026" : "Re-score"}
          </Button>
          <Button onClick={handleAutoFix} disabled={fixing}>
            {fixing ? "Fixing\u2026" : "Auto-fix"}
          </Button>
        </div>
      </div>

      {/* Score + Signals row */}
      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        {/* Score Ring */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <ScoreRing
              score={report.overall_score}
              letterGrade={report.letter_grade}
              size={160}
              className="mx-auto"
            />
            <p className="mt-3 text-center text-sm text-muted-foreground">
              Overall Quality Score
            </p>
          </CardContent>
        </Card>

        {/* Signal Bars */}
        <Card>
          <CardHeader>
            <CardTitle>Signal Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <SignalBars signals={report.signals} />
          </CardContent>
        </Card>
      </div>

      {/* Checklist / E-E-A-T / Suggestions tabs */}
      <Card>
        <CardContent>
          <ChecklistPanel
            checklist={report.checklist}
            eeat={report.eeat}
            suggestions={report.suggestions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
