"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  fetchArticles,
  previewPublishPayload,
  publishArticle,
  type Article,
  type PublishPlatform,
  type PublishPayloadPreview,
} from "@/lib/api";
import { getPlatformMeta } from "./platform-card";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platforms: PublishPlatform[];
  preselectedArticleId?: string;
  onPublished: () => void;
}

export function PublishDialog({
  open,
  onOpenChange,
  platforms,
  preselectedArticleId,
  onPublished,
}: PublishDialogProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string>("");
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<Set<string>>(
    new Set()
  );
  const [preview, setPreview] = useState<PublishPayloadPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"select" | "preview">("select");

  const connectedPlatforms = platforms.filter((p) => p.connected);

  const loadArticles = useCallback(async () => {
    setLoadingArticles(true);
    try {
      const res = await fetchArticles({ status: "published", limit: "100" });
      if (res.success) {
        setArticles(res.data);
      }
    } catch {
      // Bridge may not be running
    } finally {
      setLoadingArticles(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadArticles();
      setSelectedArticleId(preselectedArticleId || "");
      setSelectedPlatformIds(new Set());
      setPreview(null);
      setError(null);
      setStep("select");
    }
  }, [open, preselectedArticleId, loadArticles]);

  function togglePlatform(id: string) {
    setSelectedPlatformIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handlePreview() {
    if (!selectedArticleId || selectedPlatformIds.size === 0) return;
    setLoadingPreview(true);
    setError(null);
    try {
      // Preview for the first selected platform
      const firstPlatformId = Array.from(selectedPlatformIds)[0];
      const res = await previewPublishPayload(
        selectedArticleId,
        firstPlatformId
      );
      if (res.success) {
        setPreview(res.data);
        setStep("preview");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate preview");
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handlePublish() {
    if (!selectedArticleId || selectedPlatformIds.size === 0) return;
    setPublishing(true);
    setError(null);
    try {
      const res = await publishArticle(
        selectedArticleId,
        Array.from(selectedPlatformIds)
      );
      if (res.success) {
        onPublished();
        onOpenChange(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  const selectedArticle = articles.find((a) => a.id === selectedArticleId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === "select" ? "Publish Article" : "Preview & Confirm"}
          </DialogTitle>
        </DialogHeader>

        {step === "select" ? (
          <div className="space-y-4 py-2">
            {/* Article selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Article</label>
              {loadingArticles ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <Select
                  value={selectedArticleId}
                  onValueChange={(v) => v && setSelectedArticleId(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an article..." />
                  </SelectTrigger>
                  <SelectContent>
                    {articles.length === 0 ? (
                      <SelectItem value="_none" disabled>
                        No published articles available
                      </SelectItem>
                    ) : (
                      articles.map((article) => (
                        <SelectItem key={article.id} value={article.id}>
                          {article.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            <Separator />

            {/* Platform selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Select Platform(s)
              </label>
              {connectedPlatforms.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No platforms connected. Connect a platform first.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {connectedPlatforms.map((platform) => {
                    const meta = getPlatformMeta(platform.platform);
                    const isSelected = selectedPlatformIds.has(platform.id);
                    return (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => togglePlatform(platform.id)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3 text-start transition-colors",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-accent"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded text-xs font-bold text-white",
                            meta.color
                          )}
                        >
                          {meta.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {platform.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {meta.label}
                          </p>
                        </div>
                        <div
                          className={cn(
                            "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors",
                            isSelected
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/30"
                          )}
                        >
                          {isSelected && (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="white"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Preview */}
            {preview ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Title
                  </p>
                  <p className="text-sm font-medium">{preview.title}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Slug
                  </p>
                  <p className="text-sm font-mono">{preview.slug}</p>
                </div>
                {preview.excerpt && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Excerpt
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {preview.excerpt}
                    </p>
                  </div>
                )}
                {preview.tags.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {preview.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Publishing to
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(selectedPlatformIds).map((id) => {
                      const platform = connectedPlatforms.find(
                        (p) => p.id === id
                      );
                      if (!platform) return null;
                      const meta = getPlatformMeta(platform.platform);
                      return (
                        <Badge key={id} variant="outline">
                          {meta.label}: {platform.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : loadingPreview ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : null}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "preview" && (
            <Button
              variant="outline"
              onClick={() => setStep("select")}
              disabled={publishing}
            >
              Back
            </Button>
          )}
          {step === "select" ? (
            <Button
              onClick={handlePreview}
              disabled={
                !selectedArticleId ||
                selectedPlatformIds.size === 0 ||
                loadingPreview
              }
            >
              {loadingPreview ? "Loading preview..." : "Preview"}
            </Button>
          ) : (
            <Button onClick={handlePublish} disabled={publishing}>
              {publishing
                ? "Publishing..."
                : `Publish to ${selectedPlatformIds.size} platform${selectedPlatformIds.size > 1 ? "s" : ""}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
