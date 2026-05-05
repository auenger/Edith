import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

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
      <body className="min-h-screen bg-slate-50 text-gray-900 antialiased">
        <div className="flex h-screen">
          {/* Sidebar */}
          <aside className="w-60 flex flex-col" style={{ background: "var(--sidebar-bg)" }}>
            <div className="sidebar-brand h-14 flex items-center px-5">
              <h1 className="text-lg font-bold text-white tracking-wide">EDITH Board</h1>
            </div>
            <nav className="flex-1 p-3 space-y-0.5">
              {[
                { href: "/", label: "Dashboard", icon: "■" },
                { href: "/services", label: "Services", icon: "◈" },
                { href: "/artifacts", label: "Artifacts", icon: "░" },
                { href: "/knowledge-map", label: "Knowledge Map", icon: "◉" },
                { href: "/timeline", label: "Timeline", icon: "▒" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors"
                >
                  <span className="text-base opacity-70">{item.icon}</span>
                  <span>{item.label}</span>
                </a>
              ))}
            </nav>
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span
                  id="ws-status"
                  className="inline-block h-2 w-2 rounded-full bg-slate-600"
                />
                <span id="ws-status-text">Disconnected</span>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Top Bar */}
            <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 shadow-sm">
              <div id="breadcrumb" className="text-sm text-slate-500" />
              <div id="header-actions" />
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-6">{children}</div>

            {/* Footer */}
            <footer className="h-8 border-t border-slate-200 bg-white flex items-center justify-between px-6 text-xs text-slate-400">
              <span>EDITH Board v0.1.0</span>
              <span id="last-updated" />
            </footer>
          </main>
        </div>
      </body>
    </html>
  );
}
