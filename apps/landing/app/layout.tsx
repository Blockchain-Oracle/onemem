// Root layout placeholder for onemem.ai. Implemented in Pillar 7 per docs/05-our-architecture/07-marketing-and-docs/landing-architecture.md
import type { ReactNode } from "react";

export const metadata = {
  title: "OneMem — verifiable AI agent memory",
  description:
    "Cross-runtime verifiable memory + action traces for AI agents. Sui + Walrus + Seal + MemWal.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
