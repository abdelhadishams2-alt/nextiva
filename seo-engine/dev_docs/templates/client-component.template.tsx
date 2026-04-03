/**
 * @module {{ComponentName}}Client
 * @description Client component with data fetching, mutations, and real-time updates
 * @see dev_docs/screens/{{SCREEN_NUMBER}}-{{screen-slug}}.md
 *
 * Copy this template for interactive dashboard components that need:
 * - Client-side state management
 * - API mutations (create, update, delete)
 * - Optimistic updates
 * - SSE/polling for real-time data
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { toast } from 'sonner';
// import { Button } from '@/components/ui/button';
// import { DataTable } from '@/components/ui/data-table';

// ── Types ───────────────────────────────────────────────────────────────────

interface {{DataType}} {
  id: string;
  // Add fields from the API response
}

interface {{ComponentName}}ClientProps {
  initialData: {{DataType}}[];
  // Add any server-fetched props
}

// ── API helpers ─────────────────────────────────────────────────────────────

const BRIDGE_URL = process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://localhost:19847';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BRIDGE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // Authorization header managed by middleware/cookie
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `API error: ${response.status}`);
  }

  const json = await response.json();
  return json.data;
}

// ── Component ───────────────────────────────────────────────────────────────

export function {{ComponentName}}Client({ initialData }: {{ComponentName}}ClientProps) {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  // const router = useRouter();

  // ── Fetch / refresh data ────────────────────────────────────────────────

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fresh = await apiFetch<{{DataType}}[]>('/api/{{resource}}');
      setData(fresh);
    } catch (err) {
      // toast.error('Failed to refresh data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Create ──────────────────────────────────────────────────────────────

  const handleCreate = useCallback(async (payload: Partial<{{DataType}}>) => {
    try {
      const created = await apiFetch<{{DataType}}>('/api/{{resource}}', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setData(prev => [created, ...prev]); // Optimistic prepend
      // toast.success('Created successfully');
    } catch (err) {
      // toast.error('Failed to create');
      console.error(err);
    }
  }, []);

  // ── Delete ──────────────────────────────────────────────────────────────

  const handleDelete = useCallback(async (id: string) => {
    // Optimistic removal
    const previous = data;
    setData(prev => prev.filter(item => item.id !== id));

    try {
      await apiFetch(`/api/{{resource}}/${id}`, { method: 'DELETE' });
      // toast.success('Deleted');
    } catch (err) {
      setData(previous); // Rollback on error
      // toast.error('Failed to delete');
      console.error(err);
    }
  }, [data]);

  // ── SSE subscription (for real-time progress) ───────────────────────────

  // useEffect(() => {
  //   const eventSource = new EventSource(`${BRIDGE_URL}/api/{{resource}}/progress`);
  //   eventSource.onmessage = (event) => {
  //     const update = JSON.parse(event.data);
  //     // Handle real-time updates
  //   };
  //   eventSource.onerror = () => eventSource.close();
  //   return () => eventSource.close();
  // }, []);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        {/* <Button onClick={() => handleCreate({})}>Add New</Button> */}
        {/* <Button variant="outline" onClick={refreshData} disabled={isLoading}>Refresh</Button> */}
      </div>

      {/* Data display */}
      {/* <DataTable columns={columns} data={data} /> */}
    </div>
  );
}
