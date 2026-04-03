"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimelineChart } from "./timeline-chart";
import { getInventoryItem, type InventoryDetail } from "@/lib/api";

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  healthy: "default",
  needs_review: "secondary",
  thin: "outline",
  error: "destructive",
  new: "secondary",
};

interface DetailSlideoverProps {
  itemId: string | null;
  onClose: () => void;
}

export function DetailSlideover({ itemId, onClose }: DetailSlideoverProps) {
  const [item, setItem] = useState<InventoryDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!itemId) {
      setItem(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getInventoryItem(itemId)
      .then((res) => {
        if (!cancelled && res.data) setItem(res.data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [itemId]);

  return (
    <Sheet open={!!itemId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-[40vw] sm:min-w-[400px] sm:max-w-[700px] p-0 overflow-y-auto"
      >
        <SheetTitle className="sr-only">URL Details</SheetTitle>

        {loading && (
          <div className="space-y-4 p-6">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}

        {error && (
          <div className="p-6">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={onClose}>
              Close
            </Button>
          </div>
        )}

        {item && !loading && (
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold leading-tight break-all">
                  {item.title || item.url}
                </h2>
                <Badge variant={STATUS_VARIANT[item.status] ?? "outline"}>
                  {item.status.replace("_", " ")}
                </Badge>
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline break-all"
              >
                {item.url}
              </a>
            </div>

            <Separator />

            <Tabs defaultValue="overview">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
                <TabsTrigger value="structure">Structure</TabsTrigger>
                <TabsTrigger value="links">Links</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>

              {/* Overview */}
              <TabsContent value="overview" className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <StatBlock label="Health Score" value={`${item.health_score}/100`} />
                  <StatBlock label="Word Count" value={item.word_count.toLocaleString()} />
                  <StatBlock label="H2 Count" value={String(item.h2_count)} />
                  <StatBlock label="Images" value={String(item.images)} />
                  <StatBlock label="Internal Links" value={String(item.internal_links)} />
                  <StatBlock label="HTTP Status" value={String(item.http_status)} />
                  <StatBlock
                    label="Load Time"
                    value={item.load_time_ms ? `${item.load_time_ms}ms` : "N/A"}
                  />
                  <StatBlock
                    label="Mobile Friendly"
                    value={item.mobile_friendly ? "Yes" : "No"}
                  />
                </div>
                <StatBlock
                  label="Last Crawled"
                  value={new Date(item.last_crawled).toLocaleString()}
                />
              </TabsContent>

              {/* Metadata */}
              <TabsContent value="metadata" className="mt-4 space-y-4">
                <div className="space-y-3">
                  <MetaRow label="Title" value={item.title} />
                  <MetaRow
                    label="Meta Description"
                    value={item.meta_description ?? "Not set"}
                  />
                  <MetaRow
                    label="Canonical URL"
                    value={item.canonical_url ?? "Not set"}
                  />
                  <MetaRow
                    label="Redirect URL"
                    value={item.redirect_url ?? "None"}
                  />
                  <MetaRow
                    label="Structured Data"
                    value={item.structured_data ? "Present" : "Missing"}
                  />
                </div>
              </TabsContent>

              {/* Structure */}
              <TabsContent value="structure" className="mt-4 space-y-4">
                {item.headings.length > 0 ? (
                  <div className="space-y-1">
                    {item.headings.map((h, i) => (
                      <div
                        key={i}
                        className="text-sm"
                        style={{ paddingInlineStart: `${(h.level - 1) * 16}px` }}
                      >
                        <span className="text-muted-foreground font-mono text-xs me-2">
                          H{h.level}
                        </span>
                        {h.text}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No headings found.
                  </p>
                )}
              </TabsContent>

              {/* Links */}
              <TabsContent value="links" className="mt-4 space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Inbound Links ({item.inbound_links.length})
                    </h4>
                    {item.inbound_links.length > 0 ? (
                      <div className="space-y-1 max-h-[200px] overflow-y-auto">
                        {item.inbound_links.map((link, i) => (
                          <div key={i} className="text-sm truncate">
                            <span className="text-muted-foreground">{link.text}: </span>
                            <span className="break-all">{link.url}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No inbound links.</p>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Outbound Links ({item.outbound_links.length})
                    </h4>
                    {item.outbound_links.length > 0 ? (
                      <div className="space-y-1 max-h-[200px] overflow-y-auto">
                        {item.outbound_links.map((link, i) => (
                          <div key={i} className="text-sm truncate">
                            <span className="text-muted-foreground">{link.text}: </span>
                            <span className="break-all">{link.url}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No outbound links.</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Performance */}
              <TabsContent value="performance" className="mt-4 space-y-4">
                <h4 className="text-sm font-medium">
                  Performance (Last 90 Days)
                </h4>
                <TimelineChart data={item.performance} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm break-all">{value}</p>
    </div>
  );
}
