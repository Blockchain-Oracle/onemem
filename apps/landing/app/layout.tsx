import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeScript } from "@/components/ThemeScript";
import "./globals.css";

export const metadata: Metadata = {
  title: "OneMem — See what your agent did, and prove it",
  description:
    "The verifiable action-trace + owned-memory layer for AI agents. Every tool, MCP, and skill call is Merkle-chained on Sui; memory is encrypted on Walrus. Replay it and verify it independently — no login, no vendor trust.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
