// Root layout placeholder for app.onemem.ai. Implemented in Pillar 6 per docs/05-our-architecture/06-dashboard/hosted-deploy.md
import type { ReactNode } from "react";

export const metadata = {
  title: "OneMem",
  description: "Verifiable AI agent memory + action traces",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
