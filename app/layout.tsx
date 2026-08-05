import type { Metadata, Viewport } from "next";
import { Archivo, Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { SITE } from "@/content/site";
import { LabScene } from "@/components/lab-scene";
import { Chrome } from "@/components/chrome";
import { KeyboardNav } from "@/components/keyboard-nav";
import { TourRail } from "@/components/tour-rail";
import { PageTransition } from "@/components/page-transition";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} — ${SITE.title}`,
    template: `%s — ${SITE.shortName}`,
  },
  description:
    "AI engineer and builder in Kuala Lumpur. Nothing here means anything until you find the angle. " +
    "Work, process, and contact, hidden in a cloud of fragments.",
  metadataBase: new URL("https://hongbing.dev"),
  openGraph: {
    title: `${SITE.name} — ${SITE.title}`,
    description: "Nothing here means anything until you find the angle.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0b0d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body>
        {/* Persistent scene — never unmounts across routes. Renders the
            static silhouette fallback itself when WebGL is unavailable. */}
        <LabScene />

        <a
          href="#content"
          className="focus-ring sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-accent focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:text-void"
        >
          Skip to content
        </a>

        <Chrome />
        <KeyboardNav />
        <TourRail />

        <main id="content" className="lab-chrome">
          <PageTransition>{children}</PageTransition>
        </main>
      </body>
    </html>
  );
}
