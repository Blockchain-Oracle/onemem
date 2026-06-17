import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeScript } from "@/components/ThemeScript";
import "./globals.css";

export const metadata: Metadata = {
  title: "OneMem — Verifiable agent memory + trace",
  description:
    "Etherscan for AI agents. Every memory encrypted on Walrus, every action a Merkle-chained attestation on Sui. Verify, replay, and share what your agent did — across every runtime.",
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
