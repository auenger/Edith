import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <div className="flex h-screen">
          {/* Sidebar */}
          <aside className="w-60 border-r border-gray-200 bg-white flex flex-col">
            <div className="h-14 flex items-center px-5 border-b border-gray-200">
              <h1 className="text-lg font-bold text-gray-900">EDITH Board</h1>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              <a
                href="/"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <span>Dashboard</span>
              </a>
              <a
                href="/services"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <span>Services</span>
              </a>
              <a
                href="/artifacts"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <span>Artifacts</span>
              </a>
              <a
                href="/knowledge-map"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <span>Knowledge Map</span>
              </a>
              <a
                href="/timeline"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <span>Timeline</span>
              </a>
            </nav>
            <div className="p-3 border-t border-gray-200">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span
                  id="ws-status"
                  className="inline-block h-2 w-2 rounded-full bg-gray-300"
                />
                <span id="ws-status-text">Disconnected</span>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Top Bar */}
            <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6">
              <div id="breadcrumb" className="text-sm text-gray-500" />
              <div id="header-actions" />
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-6">{children}</div>

            {/* Footer */}
            <footer className="h-8 border-t border-gray-200 bg-white flex items-center justify-between px-6 text-xs text-gray-400">
              <span>EDITH Board v0.1.0</span>
              <span id="last-updated" />
            </footer>
          </main>
        </div>
      </body>
    </html>
  );
}
