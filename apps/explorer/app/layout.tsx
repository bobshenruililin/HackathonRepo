import type { ReactNode } from "react";

import "./globals.css";

export const metadata = {
  title: "Hackathon Atlas",
  description: "Local explorer that reads a generated SQLite FTS5 index. No model API.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header>
          <nav>
            <a href="/">Index</a>
            <a href="/compare">Compare</a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
