"use client";

import { cn } from "@/lib/utils";
import type { EEATDimension } from "@/lib/api";

interface EEATRadarProps {
  dimensions: EEATDimension[];
  size?: number;
  className?: string;
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case "A+":
    case "A":
      return "text-emerald-500";
    case "A-":
    case "B+":
    case "B":
      return "text-emerald-400";
    case "B-":
    case "C+":
    case "C":
      return "text-yellow-500";
    case "C-":
    case "D+":
    case "D":
      return "text-orange-500";
    default:
      return "text-red-500";
  }
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function EEATRadar({ dimensions, size = 280, className }: EEATRadarProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.35;
  const levels = 5;
  const count = dimensions.length;
  const angleStep = 360 / count;

  // Grid rings
  const rings = Array.from({ length: levels }, (_, i) => {
    const r = (maxR / levels) * (i + 1);
    const pts = Array.from({ length: count }, (_, j) =>
      polarToCartesian(cx, cy, r, j * angleStep)
    );
    return pts.map((p) => `${p.x},${p.y}`).join(" ");
  });

  // Axis lines
  const axes = Array.from({ length: count }, (_, i) => {
    const p = polarToCartesian(cx, cy, maxR, i * angleStep);
    return { x1: cx, y1: cy, x2: p.x, y2: p.y };
  });

  // Data polygon
  const dataPoints = dimensions.map((d, i) => {
    const pct = d.score / d.max_score;
    const r = maxR * pct;
    return polarToCartesian(cx, cy, r, i * angleStep);
  });
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  // Labels
  const labelOffset = maxR + 24;
  const labels = dimensions.map((d, i) => {
    const pos = polarToCartesian(cx, cy, labelOffset, i * angleStep);
    return { ...d, ...pos };
  });

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
        role="img"
        aria-label="E-E-A-T radar chart"
      >
        {/* Grid rings */}
        {rings.map((pts, i) => (
          <polygon
            key={i}
            points={pts}
            fill="none"
            className="stroke-muted"
            strokeWidth={1}
          />
        ))}
        {/* Axis lines */}
        {axes.map((a, i) => (
          <line
            key={i}
            x1={a.x1}
            y1={a.y1}
            x2={a.x2}
            y2={a.y2}
            className="stroke-muted"
            strokeWidth={1}
          />
        ))}
        {/* Data polygon */}
        <polygon
          points={dataPath}
          className="fill-primary/20 stroke-primary"
          strokeWidth={2}
        />
        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            className="fill-primary"
          />
        ))}
        {/* Labels */}
        {labels.map((l, i) => (
          <text
            key={i}
            x={l.x}
            y={l.y}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-muted-foreground text-[10px]"
          >
            {l.dimension.length > 12
              ? l.dimension.slice(0, 11) + "\u2026"
              : l.dimension}
          </text>
        ))}
      </svg>

      {/* Dimension list */}
      <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        {dimensions.map((d) => (
          <div
            key={d.dimension}
            className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{d.dimension}</p>
              <p className="truncate text-xs text-muted-foreground">{d.notes}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs tabular-nums text-muted-foreground">
                {d.score}/{d.max_score}
              </span>
              <span className={cn("text-sm font-bold", getGradeColor(d.grade))}>
                {d.grade}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EEATRadarSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="h-[280px] w-[280px] animate-pulse rounded-full bg-muted" />
      <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    </div>
  );
}
