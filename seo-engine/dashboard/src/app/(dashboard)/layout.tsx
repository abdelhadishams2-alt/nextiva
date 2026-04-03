"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DesktopSidebar, MobileSidebar } from "@/components/sidebar";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <TooltipProvider>
        <AuthGate>
          <div className="flex min-h-full">
            <DesktopSidebar />
            <div className="flex flex-1 flex-col">
              <header className="flex h-14 items-center gap-4 border-b border-border px-4 md:px-6">
                <MobileSidebar />
                <div className="flex-1" />
              </header>
              <main className="flex-1 p-4 md:p-6">{children}</main>
            </div>
          </div>
        </AuthGate>
      </TooltipProvider>
    </AuthProvider>
  );
}
