import { AuthProvider } from "@/lib/auth";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex min-h-full items-center justify-center p-4">
        {children}
      </div>
    </AuthProvider>
  );
}
