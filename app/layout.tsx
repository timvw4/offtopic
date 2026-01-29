"use client";

import "./globals.css";
import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <main style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>{children}</main>
      </body>
    </html>
  );
}
