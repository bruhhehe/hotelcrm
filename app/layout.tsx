import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { clientEnv } from "@/lib/env/client";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin", "latin-ext"],
  variable: "--font-figtree",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(clientEnv.NEXT_PUBLIC_APP_URL),
  title: {
    default: "Lodgely — Run your hotel in one place",
    template: "%s · Lodgely",
  },
  description:
    "Run your hotel in one place — every booking, every guest, every channel. Reservations, guests, rooms, payments and housekeeping for independent hotels.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  // Lets the mobile tab bar sit above the home indicator via env(safe-area-inset-bottom).
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" className={figtree.variable}>
      <body>{children}</body>
    </html>
  );
}
