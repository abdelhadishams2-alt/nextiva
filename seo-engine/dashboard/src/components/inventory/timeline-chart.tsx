"use client";

import { useState, useCallback } from "react";

interface DataPoint {
  date: string;
  clicks: number;
  impressions: number;
}

interface TimelineChartProps {
  data: DataPoint[];
}

const CHART_WIDTH = 600;
const CHART_HEIGHT = 160;
const PADDING = { top: 10, right: 10, bottom: 24, left: 10 };
const INNER_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const INNER_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;

function buildPath(
  points: Array<{ x: number; y: number }>
): string {
  if (points.length === 0) return "";
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");
}

export function TimelineChart({ data }: TimelineChartProps) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    point: DataPoint;
  } | null>(null);

  const maxClicks = Math.max(1, ...data.map((d) => d.clicks));
  const maxImpressions = Math.max(1, ...data.map((d) => d.impressions));
  const maxY = Math.max(maxClicks, maxImpressions);

  const getX = useCallback(
    (index: number) =>
      PADDING.left + (index / Math.max(1, data.length - 1)) * INNER_WIDTH,
    [data.length]
  );

  const getY = useCallback(
    (value: number) =>
      PADDING.top + INNER_HEIGHT - (value / maxY) * INNER_HEIGHT,
    [maxY]
  );

  const clickPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.clicks) }));
  const impressionPoints = data.map((d, i) => ({
    x: getX(i),
    y: getY(d.impressions),
  }));

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mouseX =
      ((e.clientX - rect.left) / rect.width) * CHART_WIDTH;
    const index = Math.round(
      ((mouseX - PADDING.left) / INNER_WIDTH) * (data.length - 1)
    );
    const clampedIndex = Math.max(0, Math.min(data.length - 1, index));
    if (data[clampedIndex]) {
      setTooltip({
        x: getX(clampedIndex),
        y: getY(data[clampedIndex].clicks),
        point: data[clampedIndex],
      });
    }
  }

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No performance data available yet.
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full h-auto"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1={PADDING.left}
            x2={CHART_WIDTH - PADDING.right}
            y1={PADDING.top + INNER_HEIGHT * (1 - pct)}
            y2={PADDING.top + INNER_HEIGHT * (1 - pct)}
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeWidth={1}
          />
        ))}

        {/* Impressions line (gray) */}
        <path
          d={buildPath(impressionPoints)}
          fill="none"
          stroke="#94a3b8"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Clicks line (blue) */}
        <path
          d={buildPath(clickPoints)}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* X-axis labels */}
        {data.length > 0 && (
          <>
            <text
              x={PADDING.left}
              y={CHART_HEIGHT - 4}
              fontSize="10"
              fill="currentColor"
              opacity={0.5}
              textAnchor="start"
            >
              {new Date(data[0].date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </text>
            <text
              x={CHART_WIDTH - PADDING.right}
              y={CHART_HEIGHT - 4}
              fontSize="10"
              fill="currentColor"
              opacity={0.5}
              textAnchor="end"
            >
              {new Date(data[data.length - 1].date).toLocaleDateString(
                undefined,
                { month: "short", day: "numeric" }
              )}
            </text>
          </>
        )}

        {/* Tooltip elements */}
        {tooltip && (
          <>
            <line
              x1={tooltip.x}
              x2={tooltip.x}
              y1={PADDING.top}
              y2={PADDING.top + INNER_HEIGHT}
              stroke="currentColor"
              strokeOpacity={0.2}
              strokeWidth={1}
              strokeDasharray="3,3"
            />
            <circle
              cx={tooltip.x}
              cy={tooltip.y}
              r={4}
              fill="#3b82f6"
              stroke="white"
              strokeWidth={2}
            />
          </>
        )}
      </svg>

      {/* Tooltip popup */}
      {tooltip && (
        <div
          className="absolute z-10 rounded-md border bg-popover px-3 py-2 text-xs shadow-md pointer-events-none"
          style={{
            left: `${(tooltip.x / CHART_WIDTH) * 100}%`,
            top: 0,
            transform: "translateX(-50%)",
          }}
        >
          <p className="font-medium">
            {new Date(tooltip.point.date).toLocaleDateString()}
          </p>
          <p>
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500 me-1" />
            Clicks: {tooltip.point.clicks.toLocaleString()}
          </p>
          <p>
            <span className="inline-block h-2 w-2 rounded-full bg-slate-400 me-1" />
            Impressions: {tooltip.point.impressions.toLocaleString()}
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
          Clicks
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-slate-400" />
          Impressions
        </div>
      </div>
    </div>
  );
}
