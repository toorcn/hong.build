"use client";

import dynamic from "next/dynamic";

// next/dynamic with ssr:false must be called inside a Client Component.
// The LabCanvas itself self-reports WebGL availability to the store and
// stays unmounted when unavailable, leaving the static fallback visible.
const LabCanvas = dynamic(() => import("@/components/lab-canvas").then((m) => m.LabCanvas), {
  ssr: false,
});

export function LabCanvasClient() {
  return <LabCanvas />;
}
