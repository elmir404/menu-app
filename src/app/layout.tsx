import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menu App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
