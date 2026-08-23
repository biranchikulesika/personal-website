import type { Persona } from "@/lib/types";

// ── Site Metadata ───────────────────────────────────────────────────────────

/** Canonical production domain. */
export const SITE_DOMAIN = "biranchikulesika.com";

/** Full canonical origin (protocol + domain). */
export const SITE_URL = `https://${SITE_DOMAIN}`;

/** Site title used in metadata templates. */
export const SITE_NAME = "Biranchi Kulesika";

/** Default description for pages that don't define their own. */
export const SITE_DESCRIPTION =
  "The personal website of Biranchi Kulesika. Software, writing, ideas, and things worth sharing.";

// ── Persona Labels ──────────────────────────────────────────────────────────

/** Display labels for the four persona types. */
export const PERSONA_LABELS: Record<Persona, string> = {
  builder: "Builder",
  operator: "Operator",
  thinker: "Thinker",
  wanderer: "Wanderer",
};

/** All personas as an ordered array for iteration. */
export const ALL_PERSONAS: Persona[] = [
  "builder",
  "operator",
  "thinker",
  "wanderer",
];
