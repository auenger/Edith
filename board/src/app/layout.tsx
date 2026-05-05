import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "EDITH Board",
  description: "AI Knowledge Infrastructure Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={cn("font-sans", geist.variable)}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="flex h-screen overflow-hidden">
          {/* Desktop Sidebar — collapsible, hidden on mobile */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Header with breadcrumbs, search, status */}
            <Header />

            {/* Content — each page manages its own padding */}
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
