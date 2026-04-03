"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { WeightHistoryEntry } from "@/lib/api";

const COLORS = [
  "#2563eb", // blue
  "#16a34a", // green
  "#dc2626", // red
  "#9333ea", // purple
  "#ea580c", // orange
  "#0891b2", // cyan
  "#d97706", // amber
  "#6366f1", // indigo
];

interface WeightHistoryChartProps {
  data: WeightHistoryEntry[];
  loading: boolean;
}

export function WeightHistoryChart({ data, loading }: WeightHistoryChartProps) {
  const { weightKeys, points, yMax } = useMemo(() => {
    if (data.length === 0)
      return { weightKeys: [] as string[], points: [] as Array<{ date: string; values: number[] }>, yMax: 100 };

    const keys = Object.keys(data[0].weights);
    const pts = data.map((entry) => ({
      date: entry.date,
      values: keys.map((k) => entry.weights[k] ?? 0),
    }));
    const maxVal = Math.max(
      ...pts.flatMap((p) => p.values),
      10
    );
    return { weightKeys: keys, points: pts, yMax: Math.ceil(maxVal / 10) * 10 };
  }, [data]);

  const chartWidth = 600;
  const chartHeight = 280;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerW = chartWidth - padding.left - padding.right;
  const innerH = chartHeight - padding.top - padding.bottom;

  function xPos(index: number) {
    if (points.length <= 1) return padding.left + innerW / 2;
    return padding.left + (index / (points.length - 1)) * innerW;
  }

  function yPos(value: number) {
    return padding.top + innerH - (value / yMax) * innerH;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Scoring Weight History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No weight recalibration data available yet.
          </p>
        ) : (
          <div className="space-y-3">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto"
              role="img"
              aria-label="Weight history line chart"
              dir="ltr"
            >
              {/* Y-axis gridlines */}
              {Array.from({ length: 5 }, (_, i) => {
                const val = (yMax / 4) * i;
                const y = yPos(val);
                return (
                  <g key={`grid-${i}`}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={chartWidth - padding.right}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity={0.1}
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-muted-foreground"
                      fontSize={10}
                    >
                      {val.toFixed(0)}
                    </text>
                  </g>
                );
              })}

              {/* Lines for each weight key */}
              {weightKeys.map((key, keyIdx) => {
                const color = COLORS[keyIdx % COLORS.length];
                const pathData = points
                  .map(
                    (pt, i) =>
                      `${i === 0 ? "M" : "L"} ${xPos(i)} ${yPos(pt.values[keyIdx])}`
                  )
                  .join(" ");
                return (
                  <g key={key}>
                    <path
                      d={pathData}
                      fill="none"
                      stroke={color}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {points.map((pt, i) => (
                      <circle
                        key={`${key}-${i}`}
                        cx={xPos(i)}
                        cy={yPos(pt.values[keyIdx])}
                        r={3}
                        fill={color}
                      >
                        <title>
                          {key}: {pt.values[keyIdx].toFixed(1)} ({pt.date})
                        </title>
                      </circle>
                    ))}
                  </g>
                );
              })}

              {/* X-axis labels */}
              {points.map((pt, i) => {
                // Show at most 6 labels
                if (points.length > 6 && i % Math.ceil(points.length / 6) !== 0)
                  return null;
                return (
                  <text
                    key={`x-${i}`}
                    x={xPos(i)}
                    y={chartHeight - 8}
                    textAnchor="middle"
                    className="fill-muted-foreground"
                    fontSize={10}
                  >
                    {new Date(pt.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </text>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 justify-center">
              {weightKeys.map((key, idx) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-xs text-muted-foreground capitalize">
                    {key.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
