import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { clientEnv } from "@/lib/env/client";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
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
  themeColor: "#FAF8F3",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
