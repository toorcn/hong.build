import type { Metadata, Viewport } from "next";
import { Archivo, Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { SITE } from "@/content/site";
import { ENTRANCE_BOOT_SCRIPT } from "@/lib/entrance-boot";
import { LabScene } from "@/components/lab-scene";
import { ColdStart } from "@/components/cold-start";
import { Chrome } from "@/components/chrome";
import { PageTransition } from "@/components/page-transition";
import { ScrollReset } from "@/components/scroll-reset";
import { SiteCursor } from "@/components/site-cursor";
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
    "Founder and AI engineer in Kuala Lumpur and San Francisco. Nothing here means anything until you find the angle. " +
    "A scroll journey through one cloud of fragments.",
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
    <html
      lang="en"
      className={`${archivo.variable} ${inter.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Hides the chrome before first paint so the entrance isn't preceded
            by a flash of the name it exists to reveal. See entrance-boot.ts. */}
        <script dangerouslySetInnerHTML={{ __html: ENTRANCE_BOOT_SCRIPT }} />
      </head>
      <body>
        {/* Persistent scene — fixed behind everything, never unmounts. */}
        <LabScene />

        {/* First-load entrance. Owns the camera and the frame for ~2.5s, then
            hands over. Skips itself on deep links and in-session returns. */}
        <ColdStart />

        <a
          href="#content"
          className="focus-ring sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-accent focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:text-void"
        >
          Skip to content
        </a>

        <Chrome />
        <ScrollReset />
        <SiteCursor />

        <main id="content" className="lab-chrome">
          <PageTransition>{children}</PageTransition>
        </main>
      </body>
    </html>
  );
}
