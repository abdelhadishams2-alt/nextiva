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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { runAnalysis, getAnalysisStatus, type AnalysisRun } from "@/lib/api";

interface RunAnalysisDialogProps {
  onComplete?: () => void;
}

export function RunAnalysisDialog({ onComplete }: RunAnalysisDialogProps) {
  const [open, setOpen] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  const pollStatus = useCallback(async () => {
    try {
      const res = await getAnalysisStatus();
      if (res.success) {
        setAnalysis(res.data);
        if (res.data.status === "completed" || res.data.status === "failed") {
          setPolling(false);
          if (res.data.status === "completed") {
            onComplete?.();
          }
        }
      }
    } catch {
      // Polling error, will retry
    }
  }, [onComplete]);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [polling, pollStatus]);

  async function handleRun() {
    setError(null);
    try {
      const res = await runAnalysis();
      if (res.success) {
        setAnalysis(res.data);
        setPolling(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to start analysis";
      setError(message);
    }
  }

  function handleClose() {
    setOpen(false);
    // Reset state after close animation
    setTimeout(() => {
      if (!polling) {
        setAnalysis(null);
        setError(null);
      }
    }, 300);
  }

  const isRunning = analysis?.status === "running" || analysis?.status === "pending";
  const isCompleted = analysis?.status === "completed";
  const isFailed = analysis?.status === "failed";

  // Estimate progress: pending = 10, running = 50, completed = 100
  let progress = 0;
  if (analysis?.status === "pending") progress = 10;
  else if (analysis?.status === "running") progress = 50;
  else if (analysis?.status === "completed") progress = 100;
  else if (analysis?.status === "failed") progress = 100;

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
          <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z" />
          <path d="m14 7 3 3" />
          <path d="M5 6v4" />
          <path d="M19 14v4" />
          <path d="M10 2v2" />
          <path d="M7 8H3" />
          <path d="M21 16h-4" />
          <path d="M11 3H9" />
        </svg>
        Run Analysis
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Run Content Intelligence Analysis</DialogTitle>
          <DialogDescription>
            Analyze your content inventory for keyword gaps, cannibalization issues,
            content decay, and optimization opportunities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!analysis && !error && (
            <div className="text-sm text-muted-foreground">
              This will scan all indexed content and generate fresh recommendations.
              The process typically takes 2-5 minutes depending on inventory size.
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {analysis && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Badge
                  variant={
                    isCompleted ? "default" : isFailed ? "destructive" : "secondary"
                  }
                  className="capitalize"
                >
                  {analysis.status}
                </Badge>
              </div>

              <Progress value={progress} className="h-2" />

              {isRunning && (
                <p className="text-xs text-muted-foreground animate-pulse">
                  Analyzing content inventory...
                </p>
              )}

              {isCompleted && analysis.results_summary && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(analysis.results_summary).map(([key, value]) => (
                    <div key={key} className="rounded-md bg-muted p-2">
                      <div className="font-medium capitalize">
                        {key.replace(/_/g, " ")}
                      </div>
                      <div className="text-lg font-bold tabular-nums">{value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {!analysis && (
            <Button onClick={handleRun}>Start Analysis</Button>
          )}
          {isRunning && (
            <Button variant="outline" disabled>
              Analysis in progress...
            </Button>
          )}
          {(isCompleted || isFailed) && (
            <>
              <Button variant="outline" onClick={handleRun}>
                Run Again
              </Button>
              <Button onClick={handleClose}>
                {isCompleted ? "View Results" : "Close"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
