"use client";

import "./globals.css";
import { ReactNode, useEffect } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Bloque le pinch-to-zoom et le double-tap zoom sur mobile
    const preventPinch = (e: any) => {
      if (e.scale && e.scale !== 1) {
        e.preventDefault();
      }
    };
    let lastTouchEnd = 0;
    const preventDoubleTap = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 400) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener("touchmove", preventPinch, { passive: false });
    document.addEventListener("gesturestart", preventPinch as EventListener);
    document.addEventListener("touchend", preventDoubleTap, { passive: false });

    return () => {
      document.removeEventListener("touchmove", preventPinch);
      document.removeEventListener("gesturestart", preventPinch as EventListener);
      document.removeEventListener("touchend", preventDoubleTap);
    };
  }, []);

  return (
    <html lang="fr">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
      </head>
      <body>
        <main className="app-shell">{children}</main>
      </body>
    </html>
  );
}
