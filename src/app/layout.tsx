import type { Metadata } from "next";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import { VeltrixProvider } from "@/lib/store";
import { ToastProvider } from "@/components/Toast";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ANITS VELTRIX | Where Campus Legends Rise",
  description:
    "A comic-tech campus platform for events, clubs, dashboards, leaderboards, certificates, and student updates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <VeltrixProvider>
          <ToastProvider>
            <SiteShell>{children}</SiteShell>
          </ToastProvider>
        </VeltrixProvider>
      </body>
    </html>
  );
}
