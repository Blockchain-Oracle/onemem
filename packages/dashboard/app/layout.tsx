// Root layout placeholder. Implemented in Pillar 6 per docs/05-our-architecture/06-dashboard/ui-architecture.md
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
