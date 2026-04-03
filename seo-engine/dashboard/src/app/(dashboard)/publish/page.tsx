"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getPublishPlatforms,
  getPublishHistory,
  connectPlatform,
  disconnectPlatform,
  testPlatformConnection,
  type PublishPlatform,
  type PublishRecord,
  type PlatformType,
} from "@/lib/api";
import {
  PlatformCard,
  EmptyPlatformCard,
} from "@/components/publish/platform-card";
import { PublishHistory } from "@/components/publish/publish-history";
import { PublishDialog } from "@/components/publish/publish-dialog";

const ALL_PLATFORM_TYPES: PlatformType[] = [
  "wordpress",
  "shopify",
  "ghost",
  "contentful",
  "strapi",
  "webflow",
  "webhook",
];

const PLATFORM_CONFIG_FIELDS: Record<
  PlatformType,
  Array<{ key: string; label: string; type: "text" | "password" | "url"; placeholder: string }>
> = {
  wordpress: [
    { key: "site_url", label: "Site URL", type: "url", placeholder: "https://example.com" },
    { key: "username", label: "Username", type: "text", placeholder: "admin" },
    { key: "app_password", label: "Application Password", type: "password", placeholder: "xxxx xxxx xxxx xxxx" },
  ],
  shopify: [
    { key: "store_domain", label: "Store Domain", type: "text", placeholder: "your-store.myshopify.com" },
    { key: "access_token", label: "Access Token", type: "password", placeholder: "shpat_..." },
    { key: "blog_id", label: "Blog ID", type: "text", placeholder: "Optional" },
  ],
  ghost: [
    { key: "api_url", label: "API URL", type: "url", placeholder: "https://your-site.ghost.io" },
    { key: "admin_api_key", label: "Admin API Key", type: "password", placeholder: "abc123..." },
  ],
  contentful: [
    { key: "space_id", label: "Space ID", type: "text", placeholder: "your_space_id" },
    { key: "management_token", label: "Management Token", type: "password", placeholder: "CFPAT-..." },
    { key: "content_type_id", label: "Content Type ID", type: "text", placeholder: "blogPost" },
  ],
  strapi: [
    { key: "api_url", label: "API URL", type: "url", placeholder: "https://strapi.example.com" },
    { key: "api_token", label: "API Token", type: "password", placeholder: "Bearer token" },
    { key: "content_type", label: "Content Type", type: "text", placeholder: "articles" },
  ],
  webflow: [
    { key: "api_token", label: "API Token", type: "password", placeholder: "Bearer token" },
    { key: "site_id", label: "Site ID", type: "text", placeholder: "your_site_id" },
    { key: "collection_id", label: "Collection ID", type: "text", placeholder: "your_collection_id" },
  ],
  webhook: [
    { key: "url", label: "Webhook URL", type: "url", placeholder: "https://example.com/webhook" },
    { key: "secret", label: "Secret (optional)", type: "password", placeholder: "HMAC secret" },
    { key: "method", label: "HTTP Method", type: "text", placeholder: "POST" },
  ],
};

export default function PublishPage() {
  const [platforms, setPlatforms] = useState<PublishPlatform[]>([]);
  const [history, setHistory] = useState<PublishRecord[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Connect dialog state
  const [showConnect, setShowConnect] = useState(false);
  const [connectType, setConnectType] = useState<PlatformType>("wordpress");
  const [connectLabel, setConnectLabel] = useState("");
  const [connectConfig, setConnectConfig] = useState<Record<string, string>>({});
  const [connecting, setConnecting] = useState(false);

  // Publish dialog state
  const [showPublish, setShowPublish] = useState(false);

  // Test state
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { healthy: boolean; message: string }>
  >({});

  const loadPlatforms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPublishPlatforms();
      if (res.success) {
        setPlatforms(res.data);
      }
    } catch {
      // Bridge may not be running
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await getPublishHistory({
        page: String(historyPage),
        limit: "20",
      });
      if (res.success) {
        setHistory(res.data);
        setHistoryTotal(res.meta.total);
      }
    } catch {
      // Bridge may not be running
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage]);

  useEffect(() => {
    loadPlatforms();
  }, [loadPlatforms]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function handleConnect() {
    if (!connectLabel) return;
    setConnecting(true);
    try {
      await connectPlatform(connectType, connectLabel, connectConfig);
      setShowConnect(false);
      setConnectLabel("");
      setConnectConfig({});
      loadPlatforms();
    } catch {
      // Error handled by apiFetch
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect(id: string) {
    try {
      await disconnectPlatform(id);
      loadPlatforms();
    } catch {
      // Error handled by apiFetch
    }
  }

  async function handleTest(id: string) {
    setTestingId(id);
    try {
      const res = await testPlatformConnection(id);
      setTestResults((prev) => ({
        ...prev,
        [id]: { healthy: res.healthy, message: res.message },
      }));
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [id]: { healthy: false, message: "Connection test failed" },
      }));
    } finally {
      setTestingId(null);
    }
  }

  function openConnectDialog(platformType: PlatformType) {
    setConnectType(platformType);
    setConnectLabel("");
    setConnectConfig({});
    setShowConnect(true);
  }

  // Determine which platform types are already connected
  const connectedTypes = new Set(platforms.map((p) => p.platform));
  const unconnectedTypes = ALL_PLATFORM_TYPES.filter(
    (t) => !connectedTypes.has(t)
  );

  const historyTotalPages = Math.max(1, Math.ceil(historyTotal / 20));
  const connectedCount = platforms.filter((p) => p.connected).length;

  return (
    <div className="space-y-6" dir="auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Publish Manager
          </h1>
          <p className="text-sm text-muted-foreground">
            {connectedCount} platform{connectedCount !== 1 ? "s" : ""} connected
          </p>
        </div>
        <Button onClick={() => setShowPublish(true)} disabled={connectedCount === 0}>
          Publish Article
        </Button>
      </div>

      <Tabs defaultValue="platforms">
        <TabsList>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="history">
            History
            {historyTotal > 0 && (
              <span className="ms-1.5 text-xs text-muted-foreground">
                ({historyTotal})
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Platforms Tab ── */}
        <TabsContent value="platforms" className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* Connected platforms */}
              {platforms.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Connected
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {platforms.map((platform) => (
                      <PlatformCard
                        key={platform.id}
                        platform={platform}
                        onDisconnect={handleDisconnect}
                        onTest={handleTest}
                        testing={testingId === platform.id}
                        testResult={testResults[platform.id] || null}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Available platforms to connect */}
              {unconnectedTypes.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Available
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {unconnectedTypes.map((type) => (
                      <EmptyPlatformCard
                        key={type}
                        platformType={type}
                        onConnect={openConnectDialog}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ── History Tab ── */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Publish History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <PublishHistory
                records={history}
                loading={historyLoading}
                total={historyTotal}
                page={historyPage}
                totalPages={historyTotalPages}
                onPageChange={setHistoryPage}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Connect Platform Dialog ── */}
      <Dialog open={showConnect} onOpenChange={setShowConnect}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Connect{" "}
              {connectType.charAt(0).toUpperCase() + connectType.slice(1)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Connection Label</Label>
              <Input
                placeholder="e.g., My WordPress Blog"
                value={connectLabel}
                onChange={(e) => setConnectLabel(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                A friendly name to identify this connection.
              </p>
            </div>

            <Separator />

            {PLATFORM_CONFIG_FIELDS[connectType]?.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label>{field.label}</Label>
                <Input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={connectConfig[field.key] || ""}
                  onChange={(e) =>
                    setConnectConfig((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnect(false)}>
              Cancel
            </Button>
            <Button onClick={handleConnect} disabled={!connectLabel || connecting}>
              {connecting ? "Connecting..." : "Connect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Publish Dialog ── */}
      <PublishDialog
        open={showPublish}
        onOpenChange={setShowPublish}
        platforms={platforms}
        onPublished={() => {
          loadHistory();
        }}
      />
    </div>
  );
}
