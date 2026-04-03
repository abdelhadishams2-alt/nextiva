"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecommendationCard, RecommendationCardSkeleton } from "@/components/opportunities/recommendation-card";
import { GapTable } from "@/components/opportunities/gap-table";
import { CannibalizationGroupCard, CannibalizationGroupSkeleton } from "@/components/opportunities/cannibalization-group";
import { DecayAlertCard, DecayAlertSkeleton } from "@/components/opportunities/decay-alert";
import { OpportunityFiltersBar } from "@/components/opportunities/opportunity-filters";
import { RunAnalysisDialog } from "@/components/opportunities/run-analysis-dialog";
import {
  getRecommendations,
  updateRecommendation,
  getKeywordGaps,
  getCannibalizationGroups,
  resolveCannibalization,
  getDecayAlerts,
  acknowledgeDecayAlert,
  type Recommendation,
  type KeywordGap,
  type CannibalizationGroup,
  type DecayAlert,
  type OpportunityFilters,
} from "@/lib/api";

const DEFAULT_PER_PAGE = 50;

const DEFAULT_FILTERS: OpportunityFilters = {
  page: 1,
  per_page: DEFAULT_PER_PAGE,
  sort: "priority_score",
  order: "desc",
};

type TabValue = "recommendations" | "gaps" | "cannibalization" | "decay";

export default function OpportunitiesPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("recommendations");

  // Recommendations state
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recTotal, setRecTotal] = useState(0);
  const [recLoading, setRecLoading] = useState(true);
  const [recError, setRecError] = useState<string | null>(null);
  const [recFilters, setRecFilters] = useState<OpportunityFilters>(DEFAULT_FILTERS);

  // Keyword gaps state
  const [gaps, setGaps] = useState<KeywordGap[]>([]);
  const [gapTotal, setGapTotal] = useState(0);
  const [gapLoading, setGapLoading] = useState(true);
  const [gapError, setGapError] = useState<string | null>(null);
  const [gapFilters, setGapFilters] = useState<OpportunityFilters>({
    ...DEFAULT_FILTERS,
    sort: "opportunity_score",
  });

  // Cannibalization state
  const [cannibalGroups, setCannibalGroups] = useState<CannibalizationGroup[]>([]);
  const [cannibalTotal, setCannibalTotal] = useState(0);
  const [cannibalLoading, setCannibalLoading] = useState(true);
  const [cannibalError, setCannibalError] = useState<string | null>(null);
  const [cannibalFilters, setCannibalFilters] = useState<OpportunityFilters>(DEFAULT_FILTERS);

  // Decay alerts state
  const [decayAlerts, setDecayAlerts] = useState<DecayAlert[]>([]);
  const [decayTotal, setDecayTotal] = useState(0);
  const [decayLoading, setDecayLoading] = useState(true);
  const [decayError, setDecayError] = useState<string | null>(null);
  const [decayFilters, setDecayFilters] = useState<OpportunityFilters>(DEFAULT_FILTERS);

  // Fetch functions
  const fetchRecommendations = useCallback(async (params: OpportunityFilters) => {
    setRecLoading(true);
    setRecError(null);
    try {
      const cleanParams = { ...params };
      if (cleanParams.type === "__all") cleanParams.type = undefined;
      if (cleanParams.impact === "__all") cleanParams.impact = undefined;
      if (cleanParams.status === "__all") cleanParams.status = undefined;
      const res = await getRecommendations(cleanParams);
      if (res.success) {
        setRecommendations(res.data);
        setRecTotal(res.meta.total);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load recommendations";
      setRecError(message);
    } finally {
      setRecLoading(false);
    }
  }, []);

  const fetchGaps = useCallback(async (params: OpportunityFilters) => {
    setGapLoading(true);
    setGapError(null);
    try {
      const cleanParams = { ...params };
      if (cleanParams.impact === "__all") cleanParams.impact = undefined;
      const res = await getKeywordGaps(cleanParams);
      if (res.success) {
        setGaps(res.data);
        setGapTotal(res.meta.total);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load keyword gaps";
      setGapError(message);
    } finally {
      setGapLoading(false);
    }
  }, []);

  const fetchCannibalization = useCallback(async (params: OpportunityFilters) => {
    setCannibalLoading(true);
    setCannibalError(null);
    try {
      const cleanParams = { ...params };
      if (cleanParams.impact === "__all") cleanParams.impact = undefined;
      const res = await getCannibalizationGroups(cleanParams);
      if (res.success) {
        setCannibalGroups(res.data);
        setCannibalTotal(res.meta.total);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load cannibalization data";
      setCannibalError(message);
    } finally {
      setCannibalLoading(false);
    }
  }, []);

  const fetchDecay = useCallback(async (params: OpportunityFilters) => {
    setDecayLoading(true);
    setDecayError(null);
    try {
      const cleanParams = { ...params };
      if (cleanParams.impact === "__all") cleanParams.impact = undefined;
      const res = await getDecayAlerts(cleanParams);
      if (res.success) {
        setDecayAlerts(res.data);
        setDecayTotal(res.meta.total);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load decay alerts";
      setDecayError(message);
    } finally {
      setDecayLoading(false);
    }
  }, []);

  // Fetch on filter change for active tab
  useEffect(() => {
    if (activeTab === "recommendations") fetchRecommendations(recFilters);
  }, [activeTab, recFilters, fetchRecommendations]);

  useEffect(() => {
    if (activeTab === "gaps") fetchGaps(gapFilters);
  }, [activeTab, gapFilters, fetchGaps]);

  useEffect(() => {
    if (activeTab === "cannibalization") fetchCannibalization(cannibalFilters);
  }, [activeTab, cannibalFilters, fetchCannibalization]);

  useEffect(() => {
    if (activeTab === "decay") fetchDecay(decayFilters);
  }, [activeTab, decayFilters, fetchDecay]);

  // Action handlers
  async function handleRecommendationAction(id: string, action: "accept" | "dismiss" | "execute") {
    await updateRecommendation(id, action);
    setRecommendations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: action === "execute" ? "executed" : action === "accept" ? "accepted" : "dismissed" } : r))
    );
  }

  async function handleResolveCannibalization(id: string, action: "merge" | "redirect" | "differentiate" | "deoptimize") {
    await resolveCannibalization(id, action);
    setCannibalGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, resolved: true } : g))
    );
  }

  async function handleAcknowledgeDecay(id: string) {
    await acknowledgeDecayAlert(id);
    setDecayAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    );
  }

  function handleGapSort(column: string) {
    setGapFilters((prev) => ({
      ...prev,
      sort: column,
      order: prev.sort === column && prev.order === "asc" ? "desc" : "asc",
      page: 1,
    }));
  }

  function handleAnalysisComplete() {
    // Refresh the active tab data
    if (activeTab === "recommendations") fetchRecommendations(recFilters);
    else if (activeTab === "gaps") fetchGaps(gapFilters);
    else if (activeTab === "cannibalization") fetchCannibalization(cannibalFilters);
    else if (activeTab === "decay") fetchDecay(decayFilters);
  }

  function renderError(error: string, retry: () => void) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-destructive mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={retry}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  function renderEmpty(message: string) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-muted-foreground mb-4"
          >
            <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m14 7 3 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h3 className="text-lg font-semibold mb-1">No data yet</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            {message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Opportunities</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Content intelligence recommendations, keyword gaps, and alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RunAnalysisDialog onComplete={handleAnalysisComplete} />
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="recommendations"
        onValueChange={(v) => setActiveTab(v as TabValue)}
      >
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="recommendations">
            Recommendations
            {recTotal > 0 && (
              <span className="ms-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
                {recTotal}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="gaps">
            Keyword Gaps
            {gapTotal > 0 && (
              <span className="ms-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
                {gapTotal}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="cannibalization">
            Cannibalization
            {cannibalTotal > 0 && (
              <span className="ms-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
                {cannibalTotal}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="decay">
            Decay Alerts
            {decayTotal > 0 && (
              <span className="ms-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
                {decayTotal}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Recommendations Tab ── */}
        <TabsContent value="recommendations">
          <div className="space-y-4">
            <OpportunityFiltersBar
              filters={recFilters}
              onChange={setRecFilters}
              onReset={() => setRecFilters(DEFAULT_FILTERS)}
              variant="recommendations"
            />

            {recError && !recLoading && renderError(recError, () => fetchRecommendations(recFilters))}

            {!recLoading && !recError && recommendations.length === 0 &&
              renderEmpty("Run an analysis to generate content recommendations based on your inventory and search performance data.")
            }

            {recLoading ? (
              <RecommendationCardSkeleton />
            ) : (
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    onAction={handleRecommendationAction}
                  />
                ))}
              </div>
            )}

            {!recLoading && recTotal > recommendations.length && (
              <div className="text-center text-sm text-muted-foreground">
                Showing {recommendations.length} of {recTotal.toLocaleString()} recommendations
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Keyword Gaps Tab ── */}
        <TabsContent value="gaps">
          <div className="space-y-4">
            <OpportunityFiltersBar
              filters={gapFilters}
              onChange={setGapFilters}
              onReset={() => setGapFilters({ ...DEFAULT_FILTERS, sort: "opportunity_score" })}
              variant="gaps"
            />

            {gapError && !gapLoading && renderError(gapError, () => fetchGaps(gapFilters))}

            {!gapLoading && !gapError && gaps.length === 0 &&
              renderEmpty("Run an analysis to discover keyword opportunities your competitors are ranking for but you are not.")
            }

            <GapTable
              gaps={gaps}
              loading={gapLoading}
              sort={gapFilters.sort}
              order={gapFilters.order}
              onSort={handleGapSort}
            />

            {!gapLoading && gapTotal > gaps.length && (
              <div className="text-center text-sm text-muted-foreground">
                Showing {gaps.length} of {gapTotal.toLocaleString()} keyword gaps
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Cannibalization Tab ── */}
        <TabsContent value="cannibalization">
          <div className="space-y-4">
            <OpportunityFiltersBar
              filters={cannibalFilters}
              onChange={setCannibalFilters}
              onReset={() => setCannibalFilters(DEFAULT_FILTERS)}
              variant="cannibalization"
            />

            {cannibalError && !cannibalLoading && renderError(cannibalError, () => fetchCannibalization(cannibalFilters))}

            {!cannibalLoading && !cannibalError && cannibalGroups.length === 0 &&
              renderEmpty("Run an analysis to detect pages competing for the same keywords on your site.")
            }

            {cannibalLoading ? (
              <CannibalizationGroupSkeleton />
            ) : (
              <div className="space-y-3">
                {cannibalGroups.map((group) => (
                  <CannibalizationGroupCard
                    key={group.id}
                    group={group}
                    onResolve={handleResolveCannibalization}
                  />
                ))}
              </div>
            )}

            {!cannibalLoading && cannibalTotal > cannibalGroups.length && (
              <div className="text-center text-sm text-muted-foreground">
                Showing {cannibalGroups.length} of {cannibalTotal.toLocaleString()} groups
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Decay Alerts Tab ── */}
        <TabsContent value="decay">
          <div className="space-y-4">
            <OpportunityFiltersBar
              filters={decayFilters}
              onChange={setDecayFilters}
              onReset={() => setDecayFilters(DEFAULT_FILTERS)}
              variant="decay"
            />

            {decayError && !decayLoading && renderError(decayError, () => fetchDecay(decayFilters))}

            {!decayLoading && !decayError && decayAlerts.length === 0 &&
              renderEmpty("Run an analysis to detect content that is losing search performance over time.")
            }

            {decayLoading ? (
              <DecayAlertSkeleton />
            ) : (
              <div className="space-y-3">
                {decayAlerts.map((alert) => (
                  <DecayAlertCard
                    key={alert.id}
                    alert={alert}
                    onAcknowledge={handleAcknowledgeDecay}
                  />
                ))}
              </div>
            )}

            {!decayLoading && decayTotal > decayAlerts.length && (
              <div className="text-center text-sm text-muted-foreground">
                Showing {decayAlerts.length} of {decayTotal.toLocaleString()} alerts
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
