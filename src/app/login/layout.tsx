import "@/styles/globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: "Login | Admin Panel",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="az" suppressHydrationWarning>
      <body className="min-h-screen bg-stone-50 antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
