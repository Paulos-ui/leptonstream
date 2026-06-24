import type { Metadata } from "next";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import Link from "next/link";
import Wordmark from "@/components/ui/Wordmark";

const serif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LeptonStream — value, in constant motion",
  description:
    "Per-second payments for live streams, run by an autonomous agent. Built on Circle nanopayments, Arc, and x402.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${serif.variable} ${mono.variable}`}
    >
      <body>
        <Wordmark />
        <nav className="fixed right-5 top-5 z-50 flex items-center gap-5 font-mono text-[12px]">
          <Link href="/studio" className="text-cream/70 transition-colors hover:text-amber">
            Dashboard
          </Link>
        </nav>
        {/* Film grain keeps the dark warm rather than sterile-digital. */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 opacity-[0.05] mix-blend-soft-light"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
        {children}
      </body>
    </html>
  );
}
