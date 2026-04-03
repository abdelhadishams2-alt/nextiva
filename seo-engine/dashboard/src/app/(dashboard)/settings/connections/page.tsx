"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { OAuthCard } from "@/components/connections/oauth-card";
import { FreshnessBanner } from "@/components/connections/freshness-banner";
import {
  getGoogleAuthUrl,
  getConnectionStatus,
  getScheduleStatus,
  triggerGSCPull,
  triggerGA4Pull,
  type ConnectionStatus,
  type ScheduleInfo,
} from "@/lib/api";

export default function ConnectionsPage() {
  const searchParams = useSearchParams();
  const [connections, setConnections] = useState<ConnectionStatus[]>([]);
  const [schedule, setSchedule] = useState<ScheduleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [statusRes, scheduleRes] = await Promise.all([
        getConnectionStatus().catch(() => null),
        getScheduleStatus().catch(() => null),
      ]);
      if (statusRes?.data) setConnections(statusRes.data);
      if (scheduleRes?.data) setSchedule(scheduleRes.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle ?connected=google success callback
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected) {
      setToast({
        type: "success",
        message: `Successfully connected ${connected}! Data sync will begin shortly.`,
      });
      // Reload connections
      loadData();
      // Clear URL params
      window.history.replaceState(null, "", "/settings/connections");
    } else if (error) {
      setToast({
        type: "error",
        message: `Connection failed: ${decodeURIComponent(error)}`,
      });
      window.history.replaceState(null, "", "/settings/connections");
    }
  }, [searchParams, loadData]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function handleConnect() {
    setConnecting(true);
    try {
      const res = await getGoogleAuthUrl();
      if (res.data?.auth_url) {
        window.location.href = res.data.auth_url;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to initiate connection";
      setToast({ type: "error", message });
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    setToast({
      type: "success",
      message: "Google disconnected. Synced data has been preserved.",
    });
    // Reload to reflect disconnected state
    loadData();
  }

  async function handleSyncNow() {
    setSyncing(true);
    try {
      await Promise.all([
        triggerGSCPull().catch(() => null),
        triggerGA4Pull().catch(() => null),
      ]);
      setToast({ type: "success", message: "Sync triggered. Data will be updated shortly." });
      // Reload connections to update last_synced_at
      setTimeout(() => loadData(), 2000);
    } catch {
      setToast({ type: "error", message: "Sync failed. Please try again." });
    } finally {
      setSyncing(false);
    }
  }

  const googleConnection =
    connections.find((c) => c.provider === "google") ?? null;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Connections</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Connections</h1>

      {/* Toast */}
      {toast && (
        <Alert
          variant={toast.type === "error" ? "destructive" : "default"}
          className={
            toast.type === "success"
              ? "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400"
              : undefined
          }
        >
          <AlertDescription>{toast.message}</AlertDescription>
        </Alert>
      )}

      {/* Freshness Banner */}
      <FreshnessBanner connections={connections} />

      {/* OAuth Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <OAuthCard
          provider="google"
          providerLabel="Google"
          connection={googleConnection}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onSyncNow={handleSyncNow}
          connecting={connecting}
          syncing={syncing}
        />
      </div>

      {/* Schedule Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sync Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {schedule ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <ScheduleBlock
                label="Google Search Console"
                enabled={schedule.gsc.enabled}
                intervalHours={schedule.gsc.interval_hours}
                nextRun={schedule.gsc.next_run}
              />
              <ScheduleBlock
                label="Google Analytics 4"
                enabled={schedule.ga4.enabled}
                intervalHours={schedule.ga4.interval_hours}
                nextRun={schedule.ga4.next_run}
              />
              <ScheduleBlock
                label="Content Crawl"
                enabled={schedule.crawl.enabled}
                intervalHours={schedule.crawl.interval_hours}
                nextRun={schedule.crawl.next_run}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Connect Google to enable automated data sync.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Empty state with CTA */}
      {connections.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-muted-foreground mb-4"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h3 className="text-lg font-semibold mb-1">No connections yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Connect your Google account to pull Search Console and Analytics
              data into your content inventory.
            </p>
            <Button onClick={handleConnect} disabled={connecting}>
              {connecting ? "Connecting..." : "Connect Google"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ScheduleBlock({
  label,
  enabled,
  intervalHours,
  nextRun,
}: {
  label: string;
  enabled: boolean;
  intervalHours: number;
  nextRun: string | null;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">{label}</p>
        <Badge variant={enabled ? "default" : "secondary"}>
          {enabled ? "Active" : "Disabled"}
        </Badge>
      </div>
      {enabled ? (
        <>
          <p className="text-xs text-muted-foreground">
            Every {intervalHours}h
          </p>
          {nextRun && (
            <p className="text-xs text-muted-foreground">
              Next: {new Date(nextRun).toLocaleString()}
            </p>
          )}
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          Connect to enable automatic sync.
        </p>
      )}
    </div>
  );
}
