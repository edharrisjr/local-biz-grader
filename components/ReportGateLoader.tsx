"use client";

import dynamic from "next/dynamic";

// next/dynamic's `ssr: false` option can only be used from a Client
// Component, so this thin wrapper exists solely to host it — the page
// itself is a Server Component and imports this file statically.
export const ReportGate = dynamic(
  () => import("@/components/ReportGate").then((mod) => mod.ReportGate),
  { ssr: false }
);
