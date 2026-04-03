"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PublishPlatform, PlatformType } from "@/lib/api";

const PLATFORM_META: Record<
  PlatformType,
  { label: string; color: string; icon: string }
> = {
  wordpress: { label: "WordPress", color: "bg-blue-600", icon: "W" },
  shopify: { label: "Shopify", color: "bg-green-600", icon: "S" },
  ghost: { label: "Ghost", color: "bg-purple-600", icon: "G" },
  contentful: { label: "Contentful", color: "bg-yellow-600", icon: "C" },
  strapi: { label: "Strapi", color: "bg-indigo-600", icon: "St" },
  webflow: { label: "Webflow", color: "bg-blue-500", icon: "Wf" },
  webhook: { label: "Webhook", color: "bg-gray-600", icon: "Wh" },
};

export function getPlatformMeta(platform: PlatformType) {
  return PLATFORM_META[platform] ?? { label: platform, color: "bg-gray-500", icon: "?" };
}

interface PlatformCardProps {
  platform: PublishPlatform;
  onDisconnect: (id: string) => void;
  onTest: (id: string) => void;
  testing: boolean;
  testResult: { healthy: boolean; message: string } | null;
}

export function PlatformCard({
  platform,
  onDisconnect,
  onTest,
  testing,
  testResult,
}: PlatformCardProps) {
  const [showDisconnect, setShowDisconnect] = useState(false);
  const meta = getPlatformMeta(platform.platform);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg text-white font-bold text-sm",
                meta.color
              )}
            >
              {meta.icon}
            </div>
            <div>
              <CardTitle className="text-base">{platform.label}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={cn(
                    "inline-block h-2.5 w-2.5 rounded-full",
                    platform.connected ? "bg-green-500" : "bg-gray-400"
                  )}
                />
                <span className="text-xs text-muted-foreground">
                  {platform.connected ? "Connected" : "Disconnected"}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {meta.label}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {platform.last_published_at && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last published</span>
                <span className="text-xs">
                  {new Date(platform.last_published_at).toLocaleDateString()}
                </span>
              </div>
            )}
            {testResult && (
              <p
                className={cn(
                  "text-xs",
                  testResult.healthy ? "text-green-500" : "text-destructive"
                )}
              >
                {testResult.message}
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTest(platform.id)}
                disabled={testing}
                className="flex-1"
              >
                {testing ? "Testing..." : "Test"}
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
        </CardContent>
      </Card>

      <Dialog open={showDisconnect} onOpenChange={setShowDisconnect}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect {platform.label}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            This will remove the connection to {platform.label}. Previously
            published articles will remain on the platform.
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
                onDisconnect(platform.id);
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

interface EmptyPlatformCardProps {
  platformType: PlatformType;
  onConnect: (platform: PlatformType) => void;
}

export function EmptyPlatformCard({
  platformType,
  onConnect,
}: EmptyPlatformCardProps) {
  const meta = getPlatformMeta(platformType);

  return (
    <Card className="border-dashed">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg text-white/60 font-bold text-sm",
              meta.color,
              "opacity-50"
            )}
          >
            {meta.icon}
          </div>
          <div>
            <CardTitle className="text-base text-muted-foreground">
              {meta.label}
            </CardTitle>
            <span className="text-xs text-muted-foreground">Not connected</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onConnect(platformType)}
        >
          Connect {meta.label}
        </Button>
      </CardContent>
    </Card>
  );
}
