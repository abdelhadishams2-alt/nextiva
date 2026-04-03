"use client";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { QualitySignal } from "@/lib/api";

interface SignalBarsProps {
  signals: QualitySignal[];
  className?: string;
}

function getBarColor(score: number): string {
  if (score >= 7) return "bg-emerald-500";
  if (score >= 5) return "bg-yellow-500";
  return "bg-red-500";
}

function getBarBg(score: number): string {
  if (score >= 7) return "bg-emerald-500/15";
  if (score >= 5) return "bg-yellow-500/15";
  return "bg-red-500/15";
}

export function SignalBars({ signals, className }: SignalBarsProps) {
  const sorted = [...signals].sort((a, b) => b.weight - a.weight);

  return (
    <div className={cn("space-y-3", className)}>
      {sorted.map((signal) => {
        const pct = (signal.score / signal.max_score) * 100;
        return (
          <Tooltip key={signal.name}>
            <TooltipTrigger
              className="block w-full text-start"
              render={<div />}
            >
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium">{signal.name}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {signal.score.toFixed(1)}/{signal.max_score}
                </span>
              </div>
              <div className={cn("mt-1 h-2.5 w-full overflow-hidden rounded-full", getBarBg(signal.score))}>
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700 ease-out",
                    getBarColor(signal.score)
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{signal.details}</p>
              <p className="mt-1 text-muted-foreground">Weight: {signal.weight}x</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

export function SignalBarsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i}>
          <div className="flex justify-between">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-4 w-10 animate-pulse rounded bg-muted" />
          </div>
          <div className="mt-1 h-2.5 w-full animate-pulse rounded-full bg-muted" />
        </div>
      ))}
    </div>
  );
}
