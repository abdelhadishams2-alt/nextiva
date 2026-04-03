/**
 * @module {{ComponentName}}
 * @description {{COMPONENT_DESCRIPTION}}
 * @see dev_docs/components/_catalog.md
 *
 * Copy this template when creating a new React component.
 * Place at: dashboard/components/{{component-name}}.tsx
 */

'use client';

import { useState } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Skeleton } from '@/components/ui/skeleton';

// ── Types ───────────────────────────────────────────────────────────────────

interface {{ComponentName}}Props {
  /** Primary data to display */
  data: {{DataType}};
  /** Optional: callback when user interacts */
  onAction?: (id: string) => void;
  /** Optional: loading state (shows skeleton) */
  isLoading?: boolean;
}

// ── Component ───────────────────────────────────────────────────────────────

export function {{ComponentName}}({ data, onAction, isLoading = false }: {{ComponentName}}Props) {
  const [selected, setSelected] = useState<string | null>(null);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        {/* <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-3/4" /> */}
      </div>
    );
  }

  // Empty state
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-zinc-400 text-sm">
          No data available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Component content here */}
    </div>
  );
}
