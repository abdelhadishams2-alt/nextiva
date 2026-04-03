"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "./score-badge";
import type { Recommendation } from "@/lib/api";

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAction: (id: string, action: "accept" | "dismiss" | "execute") => Promise<void>;
  className?: string;
}

const TYPE_LABELS: Record<string, string> = {
  content_gap: "Content Gap",
  optimization: "Optimization",
  consolidation: "Consolidation",
  new_topic: "New Topic",
  update: "Content Update",
};

const IMPACT_CONFIG: Record<string, { variant: "destructive" | "default" | "outline"; label: string }> = {
  high: { variant: "destructive", label: "High Impact" },
  medium: { variant: "default", label: "Medium Impact" },
  low: { variant: "outline", label: "Low Impact" },
};

const EFFORT_CONFIG: Record<string, string> = {
  high: "High Effort",
  medium: "Medium Effort",
  low: "Low Effort",
};

export function RecommendationCard({
  recommendation,
  onAction,
  className,
}: RecommendationCardProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const impactCfg = IMPACT_CONFIG[recommendation.impact] || IMPACT_CONFIG.low;
  const isResolved = recommendation.status !== "pending";

  async function handleAction(action: "accept" | "dismiss" | "execute") {
    setLoading(action);
    try {
      await onAction(recommendation.id, action);
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card
      className={cn(
        isResolved && "opacity-60",
        className
      )}
    >
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-start gap-2">
          <ScoreBadge score={recommendation.priority_score} size="sm" />
          <Badge variant="secondary">
            {TYPE_LABELS[recommendation.type] || recommendation.type}
          </Badge>
          <Badge variant={impactCfg.variant}>{impactCfg.label}</Badge>
          <Badge variant="outline">{EFFORT_CONFIG[recommendation.effort] || recommendation.effort}</Badge>
          {isResolved && (
            <Badge variant="secondary" className="capitalize">
              {recommendation.status}
            </Badge>
          )}
        </div>

        <div>
          <h4 className="text-sm font-medium">{recommendation.title}</h4>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {recommendation.description}
          </p>
        </div>

        {recommendation.affected_urls.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Affected:</span>{" "}
            {recommendation.affected_urls.slice(0, 3).join(", ")}
            {recommendation.affected_urls.length > 3 && (
              <span> +{recommendation.affected_urls.length - 3} more</span>
            )}
          </div>
        )}

        {recommendation.suggested_action && (
          <div className="rounded-md bg-muted/50 p-2 text-xs">
            <span className="font-medium">Suggested:</span>{" "}
            {recommendation.suggested_action}
          </div>
        )}

        {!isResolved && (
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              onClick={() => handleAction("execute")}
              disabled={loading !== null}
            >
              {loading === "execute" ? "Executing..." : "Execute"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction("accept")}
              disabled={loading !== null}
            >
              {loading === "accept" ? "Accepting..." : "Accept"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleAction("dismiss")}
              disabled={loading !== null}
            >
              {loading === "dismiss" ? "Dismissing..." : "Dismiss"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RecommendationCardSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}
