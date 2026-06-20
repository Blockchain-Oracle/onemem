import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeScript } from "@/components/ThemeScript";
import "./globals.css";

export const metadata: Metadata = {
  title: "OneMem — Decentralized memory your agent owns",
  description:
    "The owned-memory layer for AI agents. Store, search, and recall across every tool — encrypted on Walrus with Seal via MemWal, portable across runtimes, owned by you. No vendor lock-in.",
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
