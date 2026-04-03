"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ConnectionStatus } from "@/lib/api";

interface FreshnessBannerProps {
  connections: ConnectionStatus[];
}

export function FreshnessBanner({ connections }: FreshnessBannerProps) {
  const staleConnections = connections.filter((c) => {
    if (!c.connected || !c.last_synced_at) return false;
    const hoursAgo =
      (Date.now() - new Date(c.last_synced_at).getTime()) / (1000 * 60 * 60);
    return hoursAgo > 24;
  });

  const expiredConnections = connections.filter((c) => {
    if (!c.connected || !c.expires_at) return false;
    return new Date(c.expires_at).getTime() < Date.now();
  });

  if (expiredConnections.length > 0) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          <span className="font-medium">Connection expired.</span>{" "}
          {expiredConnections.map((c) => c.provider).join(", ")} token has
          expired. Please reconnect to resume data syncing.
        </AlertDescription>
      </Alert>
    );
  }

  if (staleConnections.length > 0) {
    const maxHours = Math.max(
      ...staleConnections.map((c) =>
        Math.floor(
          (Date.now() - new Date(c.last_synced_at!).getTime()) /
            (1000 * 60 * 60)
        )
      )
    );

    return (
      <Alert className="border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
        <AlertDescription>
          <span className="font-medium">Data may be stale.</span>{" "}
          Last sync was {maxHours}h ago for{" "}
          {staleConnections.map((c) => c.provider).join(", ")}. Consider
          running a manual sync.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
