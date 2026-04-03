"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import {
  fetchSettings,
  updateSettings,
  fetchQuota,
  type UserSettings,
  type QuotaStatus,
} from "@/lib/api";
import { QuotaCard } from "@/components/quota-card";
import { ApiKeyManager } from "@/components/api-key-manager";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
  { value: "he", label: "Hebrew" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ru", label: "Russian" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "pt", label: "Portuguese" },
];

const FRAMEWORKS = [
  { value: "html", label: "HTML (Standalone)" },
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "next", label: "Next.js" },
  { value: "svelte", label: "Svelte" },
  { value: "astro", label: "Astro" },
  { value: "wordpress", label: "WordPress" },
];

const CSS_FRAMEWORKS = [
  { value: "inline", label: "Inline CSS" },
  { value: "tailwind", label: "Tailwind CSS" },
  { value: "css-modules", label: "CSS Modules" },
  { value: "styled-components", label: "Styled Components" },
];

const IMAGE_STYLES = [
  { value: "realistic", label: "Realistic" },
  { value: "illustration", label: "Illustration" },
  { value: "minimal", label: "Minimal" },
  { value: "editorial", label: "Editorial" },
];

export default function SettingsPage() {
  const { isAdmin } = useAuth();

  const [settings, setSettings] = useState<UserSettings>({
    preferred_language: "en",
    preferred_framework: "html",
    preferred_css: "inline",
    default_domain: "",
    rtl_enabled: false,
    image_style: "realistic",
    max_images: 6,
    framework_override: false,
  });
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [settingsRes, quotaRes] = await Promise.all([
        fetchSettings().catch(() => null),
        fetchQuota().catch(() => null),
      ]);
      if (settingsRes?.data) setSettings((prev) => ({ ...prev, ...settingsRes.data }));
      if (quotaRes?.data) setQuota(quotaRes.data);
    } catch {
      setError("Failed to load settings. Is the bridge server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSave() {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await updateSettings(settings);
      if (res.data) setSettings((prev) => ({ ...prev, ...res.data }));
      setSaveMsg("Settings saved");
      setTimeout(() => setSaveMsg(""), 2000);
    } catch (e) {
      setSaveMsg("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (error && !quota && !settings.preferred_language) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <div className="flex items-center gap-2">
          {saveMsg && (
            <span className={`text-sm ${saveMsg === "Settings saved" ? "text-green-500" : "text-destructive"}`}>
              {saveMsg}
            </span>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Quota Usage Section — uses QuotaCard component */}
      <QuotaCard quota={quota} />

      <Tabs defaultValue="preferences">
        <TabsList>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          {isAdmin && <TabsTrigger value="api-keys">API Keys</TabsTrigger>}
          <TabsTrigger value="agents">Agents</TabsTrigger>
          {isAdmin && <TabsTrigger value="advanced">Advanced</TabsTrigger>}
        </TabsList>

        {/* ── Preferences Tab: Generation Preferences ── */}
        <TabsContent value="preferences" className="mt-4 space-y-4">
          <Card>
            <CardContent className="space-y-6 pt-6">
              <h3 className="text-base font-semibold">Generation Preferences</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Language dropdown */}
                <div className="space-y-2">
                  <Label>Default Language</Label>
                  <Select
                    value={settings.preferred_language}
                    onValueChange={(v) =>
                      setSettings((s) => ({ ...s, preferred_language: v ?? "en" }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Auto-detected from content if not set.
                  </p>
                </div>

                {/* Framework selector */}
                <div className="space-y-2">
                  <Label>Default Framework</Label>
                  <Select
                    value={settings.preferred_framework}
                    onValueChange={(v) =>
                      setSettings((s) => ({ ...s, preferred_framework: v ?? "html" }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FRAMEWORKS.filter((f) =>
                        !quota?.frameworks?.allowed ||
                        quota.frameworks.allowed.includes(f.value)
                      ).map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Auto-detected from project if not set.
                    {quota?.frameworks?.allowed && (
                      <> Your plan supports: {quota.frameworks.allowed.join(", ")}.</>
                    )}
                  </p>
                </div>

                {/* CSS strategy */}
                <div className="space-y-2">
                  <Label>CSS Framework</Label>
                  <Select
                    value={settings.preferred_css}
                    onValueChange={(v) =>
                      setSettings((s) => ({ ...s, preferred_css: v ?? "inline" }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CSS_FRAMEWORKS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Image style */}
                <div className="space-y-2">
                  <Label>Image Style</Label>
                  <Select
                    value={settings.image_style}
                    onValueChange={(v) =>
                      setSettings((s) => ({ ...s, image_style: v ?? "realistic" }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IMAGE_STYLES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Image count slider (1-6) */}
                <div className="space-y-2">
                  <Label htmlFor="image-slider">
                    Images Per Article: <span className="font-bold">{settings.max_images}</span>
                  </Label>
                  <input
                    id="image-slider"
                    type="range"
                    min={1}
                    max={6}
                    step={1}
                    value={settings.max_images}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, max_images: Number(e.target.value) }))
                    }
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground px-0.5">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <span key={n}>{n}</span>
                    ))}
                  </div>
                </div>

                {/* Default domain */}
                <div className="space-y-2">
                  <Label htmlFor="default-domain">Default Domain</Label>
                  <Input
                    id="default-domain"
                    placeholder="e.g., technology, sports, health"
                    value={settings.default_domain}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, default_domain: e.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Suggested domain when topic is ambiguous.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Project Detection Override toggle */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold">Project Detection Override</h3>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="framework-override"
                    checked={settings.framework_override}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, framework_override: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-border"
                  />
                  <Label htmlFor="framework-override" className="cursor-pointer">
                    Always use <span className="font-semibold">{
                      FRAMEWORKS.find((f) => f.value === settings.preferred_framework)?.label || settings.preferred_framework
                    }</span> instead of auto-detecting from project
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  When enabled, the project analyzer will skip framework detection and always
                  output in your preferred framework. Disable for auto-detection.
                </p>
              </div>

              <Separator />

              {/* RTL toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="rtl-enabled"
                  checked={settings.rtl_enabled}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, rtl_enabled: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="rtl-enabled" className="cursor-pointer">
                  Enable RTL layout by default (Arabic, Hebrew)
                </Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── API Keys Tab (Admin) — uses ApiKeyManager component ── */}
        {isAdmin && (
          <TabsContent value="api-keys" className="mt-4">
            <ApiKeyManager />
          </TabsContent>
        )}

        {/* ── Agents Tab ── */}
        <TabsContent value="agents" className="mt-4">
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label>Research Rounds</Label>
                <Input
                  type="number"
                  defaultValue={6}
                  min={3}
                  max={10}
                  className="w-[240px]"
                />
                <p className="text-xs text-muted-foreground">
                  Number of research rounds per article (3-10). More = deeper.
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Research Provider</Label>
                <Select defaultValue="gemini_mcp">
                  <SelectTrigger className="w-[240px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini_mcp">Gemini MCP</SelectItem>
                    <SelectItem value="websearch">WebSearch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Max Edit Duration (seconds)</Label>
                <Input
                  type="number"
                  defaultValue={600}
                  min={60}
                  max={1800}
                  className="w-[240px]"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum time for a section edit before timeout.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Advanced Tab (Admin) ── */}
        {isAdmin && (
          <TabsContent value="advanced" className="mt-4">
            <Card>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label>Rate Limit (requests/minute)</Label>
                  <Input
                    type="number"
                    defaultValue={100}
                    min={10}
                    max={1000}
                    className="w-[240px]"
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Auth Cache TTL (seconds)</Label>
                  <Input
                    type="number"
                    defaultValue={30}
                    min={0}
                    max={300}
                    className="w-[240px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    How long to cache auth verification results.
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>CORS Origins</Label>
                  <Input defaultValue="*" className="w-[360px]" />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated origins. Change from * for production.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
