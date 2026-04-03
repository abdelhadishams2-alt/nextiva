"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchSettings,
  fetchQuota,
  checkQuota,
  generateArticle,
  subscribeToProgress,
  type UserSettings,
  type QuotaStatus,
} from "@/lib/api";

// ── Constants ────────────────────────────────────────────────

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "it", label: "Italian" },
  { value: "nl", label: "Dutch" },
  { value: "ru", label: "Russian" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
];

const FRAMEWORKS = [
  { value: "auto", label: "Auto-detect" },
  { value: "html", label: "HTML (Standalone)" },
  { value: "next", label: "Next.js" },
  { value: "vue", label: "Vue" },
  { value: "svelte", label: "Svelte" },
  { value: "astro", label: "Astro" },
  { value: "wordpress", label: "WordPress" },
];

const PHASE_DESCRIPTIONS: Record<string, string> = {
  queued: "Waiting in queue...",
  initialization: "Initializing pipeline...",
  topic_parsing: "Parsing topic and keywords...",
  project_analysis: "Analyzing project context...",
  research: "Researching topic (6-round deep search)...",
  concept_generation: "Generating article concepts...",
  architecture: "Designing article architecture...",
  image_generation: "Generating images...",
  draft_writing: "Writing article draft...",
  finalization: "Finalizing and assembling output...",
  complete: "Complete!",
};

// ── Types ────────────────────────────────────────────────────

type GenerationState =
  | { phase: "idle" }
  | { phase: "checking" }
  | {
      phase: "running";
      jobId: string;
      articleId: string | null;
      step: number;
      totalSteps: number;
      phaseName: string;
      percent: number;
      estimatedSeconds: number;
      startedAt: number;
    }
  | {
      phase: "complete";
      jobId: string;
      articleId: string | null;
      filePath?: string;
      wordCount?: number;
    }
  | { phase: "error"; message: string };

// ── GenerationProgress Component ─────────────────────────────

function GenerationProgress({
  state,
}: {
  state: Extract<GenerationState, { phase: "running" }>;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - state.startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [state.startedAt]);

  const remaining = Math.max(0, state.estimatedSeconds - elapsed);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const phaseDescription = PHASE_DESCRIPTIONS[state.phaseName] || state.phaseName;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Pipeline Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={state.percent}>
          <ProgressLabel>
            Step {state.step} of {state.totalSteps}
          </ProgressLabel>
          <ProgressValue>{state.percent}%</ProgressValue>
        </Progress>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-sm font-medium">{phaseDescription}</span>
          </div>

          <p className="text-xs text-muted-foreground">
            {remaining > 0
              ? `Estimated time remaining: ${minutes}m ${seconds.toString().padStart(2, "0")}s`
              : "Finalizing..."}
          </p>
        </div>

        {/* Step indicators */}
        <div className="grid grid-cols-5 gap-1 sm:grid-cols-10">
          {Array.from({ length: state.totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-colors ${
                i < state.step
                  ? "bg-primary"
                  : i === state.step
                    ? "bg-primary/50"
                    : "bg-muted"
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── QuotaIndicator (compact inline display) ──────────────────

function QuotaIndicator({ quota }: { quota: QuotaStatus | null }) {
  if (!quota) return null;
  const { articles } = quota;
  const isUnlimited = articles.limit === -1;
  const remaining = isUnlimited ? Infinity : articles.remaining;
  const pct = isUnlimited ? 0 : Math.min(100, (articles.used / articles.limit) * 100);

  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-3">
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Articles this month
            </p>
            <Badge
              variant={
                remaining === 0
                  ? "destructive"
                  : remaining <= 5 && remaining !== Infinity
                    ? "outline"
                    : "secondary"
              }
            >
              {isUnlimited
                ? "Unlimited"
                : `${articles.remaining} of ${articles.limit} remaining`}
            </Badge>
          </div>
          {!isUnlimited && (
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  pct > 90
                    ? "bg-destructive"
                    : pct > 70
                      ? "bg-yellow-500"
                      : "bg-primary"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ────────────────────────────────────────────────

export default function GeneratePage() {
  // Form state
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("en");
  const [framework, setFramework] = useState("auto");
  const [imageCount, setImageCount] = useState(4);
  const [domainHint, setDomainHint] = useState("");

  // Loading / data state
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [genState, setGenState] = useState<GenerationState>({ phase: "idle" });

  // Track SSE cleanup
  const unsubRef = useRef<(() => void) | null>(null);

  // ── Load defaults from user settings ──
  useEffect(() => {
    async function loadDefaults() {
      setLoading(true);
      setLoadError(null);
      try {
        const [settingsRes, quotaRes] = await Promise.all([
          fetchSettings().catch(() => null),
          fetchQuota().catch(() => null),
        ]);
        if (settingsRes?.data) {
          const s = settingsRes.data;
          if (s.preferred_language) setLanguage(s.preferred_language);
          if (s.preferred_framework && s.preferred_framework !== "html") {
            setFramework(s.preferred_framework);
          }
          if (s.max_images) setImageCount(Math.min(6, Math.max(1, s.max_images)));
          if (s.default_domain) setDomainHint(s.default_domain);
        }
        if (quotaRes?.data) setQuota(quotaRes.data);
      } catch (e) {
        setLoadError("Failed to load settings. The bridge server may not be running.");
      } finally {
        setLoading(false);
      }
    }
    loadDefaults();
  }, []);

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      unsubRef.current?.();
    };
  }, []);

  // ── Form validation ──
  const topicTrimmed = topic.trim();
  const topicError =
    topicTrimmed.length > 0 && topicTrimmed.length < 3
      ? "Topic must be at least 3 characters"
      : null;
  const isRunning = genState.phase === "running" || genState.phase === "checking";
  const canGenerate = topicTrimmed.length >= 3 && !isRunning;
  const quotaRemaining = quota
    ? quota.articles.limit === -1
      ? Infinity
      : quota.articles.remaining
    : null;

  // ── Handle Generate ──
  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;

    setGenState({ phase: "checking" });

    try {
      // Check quota first
      const quotaCheck = await checkQuota("generate");
      if (!quotaCheck.allowed) {
        setGenState({
          phase: "error",
          message: quotaCheck.reason || "Quota exceeded. Upgrade your plan for more articles.",
        });
        return;
      }

      // Trigger generation
      const res = await generateArticle({
        topic: topicTrimmed,
        language,
        framework: framework === "auto" ? undefined : framework,
        image_count: imageCount,
        domain_hint: domainHint || undefined,
      });

      if (!res.success || !res.data?.job_id) {
        setGenState({ phase: "error", message: "Failed to start generation" });
        return;
      }

      const { job_id: jobId, article_id: articleId, estimated_time } = res.data;

      setGenState({
        phase: "running",
        jobId,
        articleId: articleId,
        step: 0,
        totalSteps: 10,
        phaseName: "queued",
        percent: 0,
        estimatedSeconds: estimated_time || 600,
        startedAt: Date.now(),
      });

      // Subscribe to SSE progress
      const unsub = subscribeToProgress(jobId, (event) => {
        if (event.event === "progress") {
          setGenState((prev) => {
            if (prev.phase !== "running") return prev;
            const e = event as { step?: number; total?: number; phase?: string; percent?: number };
            return {
              ...prev,
              step: e.step ?? prev.step,
              totalSteps: e.total ?? prev.totalSteps,
              phaseName: e.phase ?? prev.phaseName,
              percent: e.percent ?? prev.percent,
            };
          });
        } else if (event.event === "complete" || event.event === "completed") {
          const result = event.result as {
            article_id?: string;
            file_path?: string;
            word_count?: number;
          } | undefined;
          // Also handle structured complete event where article_id is top-level
          const eventAny = event as Record<string, unknown>;
          setGenState({
            phase: "complete",
            jobId,
            articleId: (result?.article_id || eventAny.article_id || articleId) as string | null,
            filePath: (result?.file_path || eventAny.file_path) as string | undefined,
            wordCount: (result?.word_count || eventAny.word_count) as number | undefined,
          });
        } else if (
          event.event === "failed" ||
          event.event === "error" ||
          event.event === "cancelled"
        ) {
          setGenState({
            phase: "error",
            message: event.error || (event as Record<string, unknown>).message as string || "Generation failed",
          });
        }
      });

      unsubRef.current = unsub;
    } catch (e) {
      setGenState({
        phase: "error",
        message: e instanceof Error ? e.message : "Generation failed",
      });
    }
  }, [canGenerate, topicTrimmed, language, framework, imageCount, domainHint]);

  // ── Reset form for "Generate Another" ──
  function handleReset() {
    unsubRef.current?.();
    unsubRef.current = null;
    setTopic("");
    setDomainHint("");
    setGenState({ phase: "idle" });
    // Refresh quota
    fetchQuota()
      .then((res) => {
        if (res?.data) setQuota(res.data);
      })
      .catch(() => {});
  }

  // ── Retry on error ──
  function handleRetry() {
    setGenState({ phase: "idle" });
  }

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Card>
          <CardHeader className="pb-4">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-40" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Generate Article</h1>
        <p className="text-sm text-muted-foreground">
          Create a new article using the AI pipeline.
        </p>
      </div>

      {/* Load error */}
      {loadError && (
        <Alert variant="destructive">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {/* Quota indicator */}
      <QuotaIndicator quota={quota} />

      {/* Generation Form */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Article Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Topic */}
          <div className="space-y-2">
            <Label htmlFor="topic">
              Topic <span className="text-destructive">*</span>
            </Label>
            <Input
              id="topic"
              placeholder="e.g., AI in Modern Football Scouting"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isRunning}
              autoFocus
              aria-invalid={!!topicError}
            />
            {topicError ? (
              <p className="text-xs text-destructive">{topicError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Be specific. The research engine performs better with focused topics.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Language */}
            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                value={language}
                onValueChange={(v) => v && setLanguage(v)}
                disabled={isRunning}
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
            </div>

            {/* Framework */}
            <div className="space-y-2">
              <Label>Output Framework</Label>
              <Select
                value={framework}
                onValueChange={(v) => v && setFramework(v)}
                disabled={isRunning}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FRAMEWORKS.filter(
                    (f) =>
                      !quota?.frameworks?.allowed ||
                      f.value === "auto" ||
                      quota.frameworks.allowed.includes(f.value)
                  ).map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Image Count - range slider */}
            <div className="space-y-2">
              <Label htmlFor="image-count">
                Images: {imageCount}
              </Label>
              <input
                id="image-count"
                type="range"
                min={1}
                max={6}
                step={1}
                value={imageCount}
                onChange={(e) => setImageCount(Number(e.target.value))}
                disabled={isRunning}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>6</span>
              </div>
            </div>

            {/* Domain Hint */}
            <div className="space-y-2">
              <Label htmlFor="domain-hint">
                Domain Hint <span className="text-xs text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="domain-hint"
                placeholder="e.g., healthcare, fintech, sports"
                value={domainHint}
                onChange={(e) => setDomainHint(e.target.value)}
                disabled={isRunning}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                Guides the research engine toward a specific domain.
              </p>
            </div>
          </div>

          <Separator />

          {/* Generate button */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || quotaRemaining === 0}
              className="min-w-[160px]"
            >
              {genState.phase === "checking" ? (
                <>
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Checking quota...
                </>
              ) : isRunning ? (
                <>
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Generating...
                </>
              ) : (
                "Generate Article"
              )}
            </Button>
            {quotaRemaining !== null &&
              quotaRemaining <= 5 &&
              quotaRemaining !== Infinity && (
                <Badge
                  variant={quotaRemaining === 0 ? "destructive" : "outline"}
                >
                  {quotaRemaining === 0
                    ? "Quota reached"
                    : `${quotaRemaining} remaining`}
                </Badge>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      {genState.phase === "running" && <GenerationProgress state={genState} />}

      {/* Complete */}
      {genState.phase === "complete" && (
        <Card className="border-green-500/30">
          <CardContent className="py-6 space-y-3">
            <div className="flex items-center gap-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-green-500"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <p className="font-medium">Article generated successfully</p>
            </div>
            {genState.filePath && (
              <p className="text-sm text-muted-foreground">
                Output:{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  {genState.filePath}
                </code>
              </p>
            )}
            {genState.wordCount && (
              <p className="text-sm text-muted-foreground">
                Word count: {genState.wordCount.toLocaleString()}
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              {genState.articleId && (
                <Button size="sm" asChild>
                  <Link href={`/articles/${genState.articleId}`}>
                    View Article
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleReset}>
                Generate Another
              </Button>
              {!genState.articleId && (
                <Button size="sm" variant="secondary" asChild>
                  <Link href="/articles">View Articles</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {genState.phase === "error" && (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{genState.message}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
              >
                Retry
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGenState({ phase: "idle" })}
              >
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
