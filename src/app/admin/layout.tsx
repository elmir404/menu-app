import "@/styles/globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { BranchScopeProvider } from "@/contexts/BranchScopeContext";

export const metadata = {
  title: "Admin Panel",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="az" suppressHydrationWarning>
      <body className="min-h-screen bg-stone-50 antialiased">
        <SessionProvider>
          <QueryProvider>
            <BranchScopeProvider>
            <SidebarProvider>
              <div className="flex min-h-screen w-full">
                <AdminSidebar />
                <main className="flex min-w-0 flex-1 flex-col overflow-auto">
                  <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-stone-200 bg-stone-50/95 px-4 backdrop-blur md:hidden">
                    <SidebarTrigger />
                    <span className="text-sm font-semibold text-stone-900">
                      Admin Panel
                    </span>
                  </header>
                  <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
                    {children}
                  </div>
                </main>
              </div>
            </SidebarProvider>
            </BranchScopeProvider>
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
