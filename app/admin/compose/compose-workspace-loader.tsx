"use client";

import dynamic from "next/dynamic";
import { LoadingState } from "@/components/ui/states";

/**
 * Client-side dynamic loader for the ComposeWorkspace.
 * Split into a separate client boundary so the heavy MDX editor code
 * (~2400 lines) is only fetched when someone actually visits /admin/compose.
 */
const ComposeWorkspace = dynamic(
  () =>
    import("@/components/admin/compose/compose-workspace").then((m) => m.ComposeWorkspace),
  {
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-night">
        <LoadingState title="Loading composer…" />
      </div>
    ),
    ssr: false,
  },
);

export { ComposeWorkspace };
