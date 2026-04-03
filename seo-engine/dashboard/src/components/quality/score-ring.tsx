"use client";

import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  letterGrade: string;
  size?: number;
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-yellow-500";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

function getStrokeColor(score: number): string {
  if (score >= 80) return "stroke-emerald-500";
  if (score >= 60) return "stroke-yellow-500";
  if (score >= 40) return "stroke-orange-500";
  return "stroke-red-500";
}

export function ScoreRing({ score, letterGrade, size = 160, className }: ScoreRingProps) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size, minWidth: size }}
      role="img"
      aria-label={`Quality score: ${score} out of 100, grade ${letterGrade}`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-muted"
          strokeWidth={strokeWidth}
        />
        {/* Score ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={cn("transition-all duration-1000 ease-out", getStrokeColor(score))}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-3xl font-bold tabular-nums", getScoreColor(score))}>
          {score}
        </span>
        <span className={cn("text-lg font-semibold", getScoreColor(score))}>
          {letterGrade}
        </span>
      </div>
    </div>
  );
}

export function ScoreRingSkeleton({ size = 160 }: { size?: number }) {
  return (
    <div
      className="animate-pulse rounded-full bg-muted"
      style={{ width: size, height: size, minWidth: size }}
    />
  );
}
