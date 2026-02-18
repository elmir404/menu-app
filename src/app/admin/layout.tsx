import "@/styles/globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

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
            <SidebarProvider>
              <div className="flex min-h-screen w-full">
                <AdminSidebar />
                <main className="flex-1 overflow-auto">
                  <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
                    {children}
                  </div>
                </main>
              </div>
            </SidebarProvider>
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
