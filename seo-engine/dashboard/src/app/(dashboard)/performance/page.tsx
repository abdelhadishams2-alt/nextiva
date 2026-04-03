"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fetchPortfolioSummary,
  fetchArticlePerformances,
  fetchWeightHistory,
  fetchROIReport,
  type PortfolioSummary,
  type ArticlePerformance,
  type WeightHistoryEntry,
  type ROIReport,
} from "@/lib/api";
import { PortfolioSummaryCards } from "@/components/performance/portfolio-summary";
import { ArticleTracker } from "@/components/performance/article-tracker";
import { WeightHistoryChart } from "@/components/performance/weight-history";
import { ROIReportView } from "@/components/performance/roi-report";

export default function PerformancePage() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [articles, setArticles] = useState<ArticlePerformance[]>([]);
  const [weights, setWeights] = useState<WeightHistoryEntry[]>([]);
  const [roi, setROI] = useState<ROIReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [portfolioRes, articlesRes, weightsRes, roiRes] =
          await Promise.all([
            fetchPortfolioSummary().catch(() => null),
            fetchArticlePerformances({ limit: "20" }).catch(() => null),
            fetchWeightHistory().catch(() => null),
            fetchROIReport().catch(() => null),
          ]);

        if (portfolioRes?.success) setPortfolio(portfolioRes.data);
        if (articlesRes?.success) setArticles(articlesRes.data);
        if (weightsRes?.success) setWeights(weightsRes.data);
        if (roiRes?.success) setROI(roiRes.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Performance</h1>

      <PortfolioSummaryCards data={portfolio} loading={loading} />

      <Tabs defaultValue="articles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="articles">Article Tracker</TabsTrigger>
          <TabsTrigger value="weights">Weight History</TabsTrigger>
          <TabsTrigger value="roi">ROI Report</TabsTrigger>
        </TabsList>

        <TabsContent value="articles">
          <ArticleTracker articles={articles} loading={loading} />
        </TabsContent>

        <TabsContent value="weights">
          <WeightHistoryChart data={weights} loading={loading} />
        </TabsContent>

        <TabsContent value="roi">
          <ROIReportView data={roi} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
