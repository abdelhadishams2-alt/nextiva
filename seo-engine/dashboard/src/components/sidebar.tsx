"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  adminOnly?: boolean;
  group?: "main" | "settings";
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", group: "main" },
  { label: "Generate", href: "/generate", group: "main" },
  { label: "Articles", href: "/articles", group: "main" },
  { label: "Content Inventory", href: "/inventory", group: "main" },
  { label: "Opportunities", href: "/opportunities", group: "main" },
  { label: "Voice Profiles", href: "/voice", group: "main" },
  { label: "Blueprints", href: "/blueprints", group: "main" },
  { label: "Performance", href: "/performance", group: "main" },
  { label: "Publish", href: "/publish", group: "main" },
  { label: "Admin", href: "/admin", adminOnly: true, group: "main" },
  { label: "Settings", href: "/settings", group: "settings" },
  { label: "Connections", href: "/settings/connections", group: "settings" },
];

function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);
  const mainItems = items.filter((item) => item.group === "main");
  const settingsItems = items.filter((item) => item.group === "settings");

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav className="flex flex-col gap-1">
      {mainItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClick}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive(item.href)
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          {item.label === "Generate" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v3m6.36-.64-2.12 2.12M21 12h-3M18.36 18.36l-2.12-2.12M12 21v-3M7.76 18.36l2.12-2.12M3 12h3M5.64 5.64l2.12 2.12" />
            </svg>
          )}
          {item.label === "Content Inventory" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
              <path d="M14 2v4a2 2 0 0 0 2 2h4" />
              <path d="M10 9H8" />
              <path d="M16 13H8" />
              <path d="M16 17H8" />
            </svg>
          )}
          {item.label === "Opportunities" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z" />
              <path d="m14 7 3 3" />
              <path d="M5 6v4" />
              <path d="M19 14v4" />
              <path d="M10 2v2" />
              <path d="M7 8H3" />
              <path d="M21 16h-4" />
              <path d="M11 3H9" />
            </svg>
          )}
          {item.label === "Voice Profiles" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          )}
          {item.label === "Performance" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          )}
          {item.label === "Publish" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" x2="12" y1="2" y2="15" />
            </svg>
          )}
          {item.label}
        </Link>
      ))}
      {settingsItems.length > 0 && (
        <>
          <div className="my-2 px-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Settings
            </p>
          </div>
          {settingsItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClick}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {item.label === "Connections" && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              )}
              {item.label}
            </Link>
          ))}
        </>
      )}
    </nav>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const initials = user.email
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">{user.email}</p>
      </div>
      <Button variant="ghost" size="sm" onClick={logout}>
        Logout
      </Button>
    </div>
  );
}

export function DesktopSidebar() {
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r border-border">
      <div className="flex h-14 items-center px-4 font-bold tracking-tight">
        ChainIQ
      </div>
      <Separator />
      <div className="flex-1 overflow-y-auto p-3">
        <NavLinks />
      </div>
      <Separator />
      <UserMenu />
    </aside>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground md:hidden">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
        <span className="sr-only">Menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex h-14 items-center px-4 font-bold tracking-tight">
          ChainIQ
        </div>
        <Separator />
        <div className="p-3">
          <NavLinks onClick={() => setOpen(false)} />
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <Separator />
          <UserMenu />
        </div>
      </SheetContent>
    </Sheet>
  );
}
