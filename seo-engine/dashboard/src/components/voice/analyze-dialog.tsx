"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { analyzeSiteVoice, getCorpusStatus, type AnalyzeSiteResult } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface AnalyzeDialogProps {
  onComplete?: () => void;
}

export function AnalyzeDialog({ onComplete }: AnalyzeDialogProps) {
  const [open, setOpen] = useState(false);
  const [siteUrl, setSiteUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeSiteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [corpusStatus, setCorpusStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();

  const pollCorpus = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await getCorpusStatus(user.id);
      if (res.success && res.data.sessions?.length > 0) {
        const latest = res.data.sessions[0];
        setCorpusStatus(latest.status);

        if (latest.total_pages > 0) {
          setProgress(Math.round((latest.pages_analyzed / latest.total_pages) * 100));
        } else {
          setProgress(10);
        }

        if (latest.status === "completed" || latest.status === "failed") {
          setPolling(false);
          if (latest.status === "completed") {
            setProgress(100);
            onComplete?.();
          }
        }
      }
    } catch {
      // Polling error, will retry
    }
  }, [user?.id, onComplete]);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(pollCorpus, 3000);
    return () => clearInterval(interval);
  }, [polling, pollCorpus]);

  function validateUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      if (!parsed.protocol.startsWith("http")) {
        setUrlError("URL must start with http:// or https://");
        return false;
      }
      setUrlError(null);
      return true;
    } catch {
      setUrlError("Please enter a valid URL");
      return false;
    }
  }

  async function handleSubmit() {
    if (!validateUrl(siteUrl)) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await analyzeSiteVoice(siteUrl);
      if (res.success) {
        setResult(res.data);
        if (res.data.status === "started" || res.data.status === "already_running") {
          setPolling(true);
          setProgress(10);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to start analysis";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setTimeout(() => {
      if (!polling) {
        setResult(null);
        setError(null);
        setSiteUrl("");
        setUrlError(null);
        setCorpusStatus(null);
        setProgress(0);
      }
    }, 300);
  }

  const isRunning = polling || corpusStatus === "running" || corpusStatus === "crawling";
  const isCompleted = corpusStatus === "completed";
  const isFailed = corpusStatus === "failed";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button />}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="me-1.5"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        Analyze Site
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Analyze Site Voice</DialogTitle>
          <DialogDescription>
            Crawl a website to extract writing style signals, classify content as human or AI,
            and build voice personas from the corpus.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!result && !error && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="site-url">Site URL</Label>
                <Input
                  id="site-url"
                  type="url"
                  placeholder="https://example.com"
                  value={siteUrl}
                  onChange={(e) => {
                    setSiteUrl(e.target.value);
                    if (urlError) setUrlError(null);
                  }}
                  aria-invalid={urlError ? "true" : undefined}
                  aria-describedby={urlError ? "url-error" : undefined}
                  dir="ltr"
                />
                {urlError && (
                  <p id="url-error" className="text-xs text-destructive">
                    {urlError}
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                The analysis crawls your site, extracts text from each page, runs
                stylometric analysis, and clusters articles into voice personas.
                This typically takes 3-10 minutes depending on site size.
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Badge
                  variant={
                    isCompleted ? "default" : isFailed ? "destructive" : "secondary"
                  }
                  className="capitalize"
                >
                  {corpusStatus || result.status}
                </Badge>
              </div>

              <Progress value={progress} className="h-2" />

              {isRunning && (
                <p className="text-xs text-muted-foreground animate-pulse">
                  Analyzing site content and extracting voice signals...
                </p>
              )}

              {isCompleted && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  Analysis complete. Voice personas have been generated from the corpus.
                </div>
              )}

              {isFailed && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  Analysis failed. Please try again or check the site URL.
                </div>
              )}

              {result.message && !isCompleted && !isFailed && (
                <p className="text-xs text-muted-foreground">{result.message}</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {!result && (
            <Button onClick={handleSubmit} disabled={submitting || !siteUrl.trim()}>
              {submitting ? "Starting..." : "Start Analysis"}
            </Button>
          )}
          {isRunning && (
            <Button variant="outline" disabled>
              Analysis in progress...
            </Button>
          )}
          {(isCompleted || isFailed) && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setError(null);
                  setCorpusStatus(null);
                  setProgress(0);
                }}
              >
                Analyze Another
              </Button>
              <Button onClick={handleClose}>
                {isCompleted ? "View Personas" : "Close"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
