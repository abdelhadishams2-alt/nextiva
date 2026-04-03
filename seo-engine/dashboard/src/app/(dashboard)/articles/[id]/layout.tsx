"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Overview", href: "" },
  { label: "Quality", href: "/quality" },
] as const;

export default function ArticleDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const articleId = params.id as string;
  const basePath = `/articles/${articleId}`;

  return (
    <div className="space-y-4">
      {/* Tab navigation */}
      <nav
        className="flex gap-1 border-b border-border"
        aria-label="Article sections"
      >
        {TABS.map((tab) => {
          const tabPath = `${basePath}${tab.href}`;
          const isActive = pathname === tabPath;
          return (
            <Link
              key={tab.href}
              href={tabPath}
              className={cn(
                "relative inline-flex items-center px-3 py-2 text-sm font-medium transition-colors",
                "hover:text-foreground",
                isActive
                  ? "text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary"
                  : "text-muted-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* Page content */}
      {children}
    </div>
  );
}
