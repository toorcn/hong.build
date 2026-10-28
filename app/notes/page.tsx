import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hackathons & competitions",
  robots: { index: false, follow: true },
  alternates: { canonical: "https://hong.build/hackathons" },
};

/** Static-export fallback; the production Worker sends an HTTP 308. */
export default function NotesRedirectPage() {
  return (
    <>
      <meta httpEquiv="refresh" content="0;url=/hackathons" />
      <p><Link href="/hackathons">Continue to hackathons & competitions →</Link></p>
    </>
  );
}
