"use client";

import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  maxScore?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getScoreColor(score: number, max: number): string {
  const pct = (score / max) * 100;
  if (pct >= 80) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (pct >= 60) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  if (pct >= 40) return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
}

const SIZE_CLASSES = {
  sm: "h-5 min-w-[2rem] px-1.5 text-xs",
  md: "h-6 min-w-[2.5rem] px-2 text-sm",
  lg: "h-8 min-w-[3rem] px-3 text-base font-semibold",
} as const;

export function ScoreBadge({
  score,
  maxScore = 100,
  size = "md",
  className,
}: ScoreBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium tabular-nums",
        SIZE_CLASSES[size],
        getScoreColor(score, maxScore),
        className
      )}
    >
      {score}
    </span>
  );
}
