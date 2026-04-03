"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ROIReport } from "@/lib/api";

interface ROIReportViewProps {
  data: ROIReport | null;
  loading: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function ROIReportView({ data, loading }: ROIReportViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">ROI Report</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
            <Skeleton className="h-[180px] w-full" />
          </div>
        ) : !data ? (
          <p className="text-sm text-muted-foreground">
            No ROI data available yet. Publish articles to start tracking
            returns.
          </p>
        ) : (
          <div className="space-y-6">
            {/* Summary metrics */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">
                  Total Investment
                </p>
                <p className="text-lg font-bold">
                  {formatCurrency(data.total_investment)}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">
                  Estimated Traffic Value
                </p>
                <p className="text-lg font-bold">
                  {formatCurrency(data.total_revenue)}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">ROI</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold">
                    {data.roi_percentage.toFixed(1)}%
                  </p>
                  <Badge
                    variant={
                      data.roi_percentage >= 0 ? "default" : "destructive"
                    }
                  >
                    {data.roi_percentage >= 0 ? "Positive" : "Negative"}
                  </Badge>
                </div>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">
                  Revenue / Article
                </p>
                <p className="text-lg font-bold">
                  {formatCurrency(data.revenue_per_article)}
                </p>
              </div>
            </div>

            {/* ROI bar visualization (SVG) */}
            {data.monthly_breakdown.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">
                  Monthly Breakdown
                </p>
                <svg
                  viewBox={`0 0 ${Math.max(data.monthly_breakdown.length * 80 + 60, 400)} 180`}
                  className="w-full h-auto"
                  role="img"
                  aria-label="Monthly ROI bar chart"
                  dir="ltr"
                >
                  {data.monthly_breakdown.map((month, i) => {
                    const maxVal = Math.max(
                      ...data.monthly_breakdown.map((m) =>
                        Math.max(m.cost, m.estimated_traffic_value)
                      ),
                      1
                    );
                    const barW = 28;
                    const gap = 8;
                    const groupW = barW * 2 + gap;
                    const x = 50 + i * (groupW + 20);
                    const costH = (month.cost / maxVal) * 120;
                    const revH = (month.estimated_traffic_value / maxVal) * 120;

                    return (
                      <g key={month.month}>
                        {/* Cost bar */}
                        <rect
                          x={x}
                          y={140 - costH}
                          width={barW}
                          height={costH}
                          rx={3}
                          className="fill-destructive/60"
                        >
                          <title>
                            Cost: {formatCurrency(month.cost)}
                          </title>
                        </rect>
                        {/* Revenue bar */}
                        <rect
                          x={x + barW + gap}
                          y={140 - revH}
                          width={barW}
                          height={revH}
                          rx={3}
                          className="fill-primary/60"
                        >
                          <title>
                            Value: {formatCurrency(month.estimated_traffic_value)}
                          </title>
                        </rect>
                        {/* Month label */}
                        <text
                          x={x + groupW / 2}
                          y={158}
                          textAnchor="middle"
                          className="fill-muted-foreground"
                          fontSize={10}
                        >
                          {month.month}
                        </text>
                        {/* ROI label */}
                        <text
                          x={x + groupW / 2}
                          y={172}
                          textAnchor="middle"
                          className="fill-muted-foreground"
                          fontSize={9}
                        >
                          {month.roi >= 0 ? "+" : ""}
                          {month.roi.toFixed(0)}%
                        </text>
                      </g>
                    );
                  })}
                </svg>
                <div className="flex gap-4 justify-center mt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-destructive/60" />
                    <span className="text-xs text-muted-foreground">Cost</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary/60" />
                    <span className="text-xs text-muted-foreground">
                      Traffic Value
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Monthly breakdown table */}
            {data.monthly_breakdown.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-center">Articles</TableHead>
                      <TableHead className="text-end">Cost</TableHead>
                      <TableHead className="text-end">Traffic Value</TableHead>
                      <TableHead className="text-end">ROI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.monthly_breakdown.map((month) => (
                      <TableRow key={month.month}>
                        <TableCell className="font-medium">
                          {month.month}
                        </TableCell>
                        <TableCell className="text-center">
                          {month.articles_produced}
                        </TableCell>
                        <TableCell className="text-end">
                          {formatCurrency(month.cost)}
                        </TableCell>
                        <TableCell className="text-end">
                          {formatCurrency(month.estimated_traffic_value)}
                        </TableCell>
                        <TableCell className="text-end">
                          <Badge
                            variant={
                              month.roi >= 0 ? "default" : "destructive"
                            }
                          >
                            {month.roi >= 0 ? "+" : ""}
                            {month.roi.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
