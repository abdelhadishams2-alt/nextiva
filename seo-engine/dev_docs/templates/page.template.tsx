/**
 * @module {{PageName}}Page
 * @description Next.js 16 App Router page for {{PAGE_DESCRIPTION}}
 * @see dev_docs/screens/{{SCREEN_NUMBER}}-{{screen-slug}}.md
 *
 * Copy this template when creating a new dashboard page.
 * Place at: dashboard/app/{{route}}/page.tsx
 */

import type { Metadata } from 'next';
// import { redirect } from 'next/navigation';
// import { createServerClient } from '@/lib/supabase-server';
// import { {{PageName}}Client } from './{{page-name}}-client';

// ── Metadata ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: '{{Page Title}} — ChainIQ',
  description: '{{PAGE_DESCRIPTION}}',
};

// ── Server Component ────────────────────────────────────────────────────────

export default async function {{PageName}}Page() {
  // Auth check (redirect to /login if not authenticated)
  // const supabase = createServerClient();
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) redirect('/login');

  // Server-side data fetching (cached, runs at request time)
  // const response = await fetch(`${process.env.BRIDGE_URL}/api/{{resource}}`, {
  //   headers: { Authorization: `Bearer ${session.access_token}` },
  //   next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
  // });
  // const { data } = await response.json();

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">
            {{Page Title}}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {{PAGE_DESCRIPTION}}
          </p>
        </div>

        {/* Primary action button */}
        {/* <Button>Action</Button> */}
      </div>

      {/* Main content */}
      {/* <{{PageName}}Client initialData={data} /> */}
    </div>
  );
}
