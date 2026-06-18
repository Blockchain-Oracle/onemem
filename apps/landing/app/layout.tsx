import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeScript } from "@/components/ThemeScript";
import "./globals.css";

export const metadata: Metadata = {
  title: "OneMem - Decentralized persistent memory for AI agents",
  description:
    "Decentralized persistent memory for AI agents. Store encrypted memories on Walrus, anchor activity on Sui, and carry agent context across runtimes.",
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
