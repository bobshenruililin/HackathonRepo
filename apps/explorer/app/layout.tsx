import type { ReactNode } from "react";

import "./globals.css";

export const metadata = {
  title: "Hackathon Atlas",
  description: "Local scaffold that reads a generated SQLite FTS5 index.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
