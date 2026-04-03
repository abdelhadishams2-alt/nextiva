"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/lib/api";

type DotColor = "green" | "yellow" | "red" | "gray";

function getStatusDot(connection: ConnectionStatus | null): {
  color: DotColor;
  label: string;
} {
  if (!connection || !connection.connected) {
    return { color: "gray", label: "Disconnected" };
  }

  if (connection.expires_at) {
    const expiresAt = new Date(connection.expires_at).getTime();
    if (expiresAt < Date.now()) {
      return { color: "red", label: "Expired" };
    }
  }

  if (!connection.last_synced_at) {
    return { color: "yellow", label: "Never synced" };
  }

  const lastSynced = new Date(connection.last_synced_at).getTime();
  const hoursAgo = (Date.now() - lastSynced) / (1000 * 60 * 60);

  if (hoursAgo > 48) {
    return { color: "red", label: "Stale (>48h)" };
  }
  if (hoursAgo > 24) {
    return { color: "yellow", label: "Stale (>24h)" };
  }
  return { color: "green", label: "Connected" };
}

const DOT_CLASSES: Record<DotColor, string> = {
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
  gray: "bg-gray-400",
};

interface OAuthCardProps {
  provider: string;
  providerLabel: string;
  connection: ConnectionStatus | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onSyncNow: () => void;
  connecting: boolean;
  syncing: boolean;
}

export function OAuthCard({
  provider,
  providerLabel,
  connection,
  onConnect,
  onDisconnect,
  onSyncNow,
  connecting,
  syncing,
}: OAuthCardProps) {
  const [showDisconnect, setShowDisconnect] = useState(false);
  const status = getStatusDot(connection);
  const isConnected = connection?.connected ?? false;

  function formatLastSynced(dateStr: string | null): string {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              {provider === "google" && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
            </div>
            <div>
              <CardTitle className="text-base">{providerLabel}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={cn(
                    "inline-block h-2.5 w-2.5 rounded-full",
                    DOT_CLASSES[status.color]
                  )}
                />
                <span className="text-xs text-muted-foreground">
                  {status.label}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last synced</span>
                <span>{formatLastSynced(connection?.last_synced_at ?? null)}</span>
              </div>
              {connection?.scopes && connection.scopes.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Scopes</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {connection.scopes.length} granted
                  </span>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSyncNow}
                  disabled={syncing}
                  className="flex-1"
                >
                  {syncing ? "Syncing..." : "Sync Now"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setShowDisconnect(true)}
                >
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Connect your {providerLabel} account to enable data sync from
                Search Console and Analytics.
              </p>
              <Button
                onClick={onConnect}
                disabled={connecting}
                className="w-full"
              >
                {connecting ? "Connecting..." : `Connect ${providerLabel}`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDisconnect} onOpenChange={setShowDisconnect}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect {providerLabel}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            This will revoke access to your {providerLabel} account. Synced data
            will remain but no new data will be fetched until you reconnect.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDisconnect(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowDisconnect(false);
                onDisconnect();
              }}
            >
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
