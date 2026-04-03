"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DecayAlert } from "@/lib/api";

interface DecayAlertCardProps {
  alert: DecayAlert;
  onAcknowledge: (id: string) => Promise<void>;
  className?: string;
}

const SEVERITY_CONFIG: Record<string, { variant: "destructive" | "default" | "outline"; label: string }> = {
  critical: { variant: "destructive", label: "Critical" },
  warning: { variant: "default", label: "Warning" },
  info: { variant: "outline", label: "Info" },
};

const METRIC_LABELS: Record<string, string> = {
  clicks: "Clicks",
  impressions: "Impressions",
  position: "Position",
  ctr: "CTR",
};

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  declining?: boolean;
}

function Sparkline({ data, width = 80, height = 24, className, declining }: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const pathD = `M${points.join(" L")}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("inline-block", className)}
      aria-hidden="true"
    >
      <path
        d={pathD}
        fill="none"
        stroke={declining ? "var(--color-destructive, #ef4444)" : "var(--color-chart-2, #22c55e)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DecayAlertCard({
  alert,
  onAcknowledge,
  className,
}: DecayAlertCardProps) {
  const [loading, setLoading] = useState(false);
  const severityCfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
  const isDeclining = alert.change_percent < 0;
  const isPositionMetric = alert.metric === "position";
  // For position, an increase in value means decline (worse ranking)
  const isNegativeChange = isPositionMetric ? alert.change_percent > 0 : alert.change_percent < 0;

  async function handleAcknowledge() {
    setLoading(true);
    try {
      await onAcknowledge(alert.id);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className={cn(alert.acknowledged && "opacity-60", className)}>
      <CardContent>
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={severityCfg.variant}>{severityCfg.label}</Badge>
              <Badge variant="secondary">{METRIC_LABELS[alert.metric] || alert.metric}</Badge>
              {alert.acknowledged && (
                <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                  Acknowledged
                </Badge>
              )}
            </div>

            <h4 className="text-sm font-medium truncate" title={alert.title}>
              {alert.title}
            </h4>
            <p className="text-xs text-muted-foreground truncate" title={alert.url}>
              {alert.url}
            </p>

            <div className="flex items-center gap-4 pt-1">
              <div className="text-xs">
                <span className="text-muted-foreground">Previous:</span>{" "}
                <span className="font-medium tabular-nums">
                  {alert.metric === "ctr"
                    ? `${(alert.previous_value * 100).toFixed(1)}%`
                    : alert.previous_value.toLocaleString()}
                </span>
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground">Current:</span>{" "}
                <span className="font-medium tabular-nums">
                  {alert.metric === "ctr"
                    ? `${(alert.current_value * 100).toFixed(1)}%`
                    : alert.current_value.toLocaleString()}
                </span>
              </div>
              <div
                className={cn(
                  "text-xs font-medium tabular-nums",
                  isNegativeChange ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
                )}
              >
                {alert.change_percent > 0 ? "+" : ""}
                {alert.change_percent.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Sparkline
              data={alert.trend}
              declining={isDeclining}
              width={80}
              height={28}
            />
            {!alert.acknowledged && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleAcknowledge}
                disabled={loading}
              >
                {loading ? "..." : "Acknowledge"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DecayAlertSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

export { Sparkline };
