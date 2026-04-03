"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { QuotaStatus } from "@/lib/api";

interface QuotaCardProps {
  quota: QuotaStatus | null;
  /** Compact mode hides the upgrade CTA */
  compact?: boolean;
}

function ProgressBar({ used, limit, label }: { used: number; limit: number; label: string }) {
  const isUnlimited = limit === -1;
  const pct = isUnlimited ? 0 : Math.min(100, (used / limit) * 100);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">
          {used}
          <span className="text-sm font-normal text-muted-foreground">
            {" / "}
            {isUnlimited ? "Unlimited" : limit}
          </span>
        </p>
        {!isUnlimited && (
          <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
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
      </CardContent>
    </Card>
  );
}

/**
 * QuotaCard — displays plan name, article usage, and edit usage
 * with visual progress bars and an optional "Upgrade" CTA for
 * free/starter plans.
 */
export function QuotaCard({ quota, compact = false }: QuotaCardProps) {
  if (!quota) return null;

  return (
    <div className="space-y-4">
      {/* Quota progress bars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold capitalize">{quota.plan}</p>
          </CardContent>
        </Card>

        <ProgressBar
          used={quota.articles.used}
          limit={quota.articles.limit}
          label="Articles This Month"
        />

        <ProgressBar
          used={quota.edits.used}
          limit={quota.edits.limit}
          label="Edits Today"
        />
      </div>

      {/* Upgrade CTA for free/starter */}
      {!compact && (quota.plan === "free" || quota.plan === "starter") && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {quota.plan === "free"
                  ? "Unlock more articles, frameworks, and languages"
                  : "Need unlimited articles and all frameworks?"}
              </p>
              <p className="text-xs text-muted-foreground">
                {quota.plan === "free"
                  ? "Upgrade to Starter for 50 articles/month, React & Vue output, and 3 languages."
                  : "Upgrade to Professional for 200 articles/month, all frameworks, all languages, and API keys."}
              </p>
            </div>
            <Button size="sm" className="shrink-0">
              Upgrade to {quota.plan === "free" ? "Starter" : "Professional"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
