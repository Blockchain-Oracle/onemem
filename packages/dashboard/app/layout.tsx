import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { ThemeScript } from "@/components/ThemeScript";
import "./globals.css";

export const metadata: Metadata = {
  title: "OneMem — decentralized memory for your agents",
  description: "Readable, owned memory for AI agents — stored on Walrus + Seal via MemWal.",
  icons: [{ rel: "icon", url: "/favicon.svg", type: "image/svg+xml" }],
};

function activeNamespaceLabel(): string {
  const id = process.env.ONEMEM_NAMESPACE_ID;
  return id ? `${id.slice(0, 8)}…` : "no namespace";
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <AppShell namespace={activeNamespaceLabel()} namespaceRole="OWNER">
          {children}
        </AppShell>
      </body>
    </html>
  );
}
