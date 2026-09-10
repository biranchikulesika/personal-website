import {
  PERSONA_LABELS,
  SITE_DOMAIN,
  SITE_NAME,
  SITE_URL,
} from "@/lib/constants";
import { SITE_CONFIG } from "@/lib/config/site";
import { ContentService } from "@/lib/services/content.service";
import { stripMarkdown, textSnippet } from "@/lib/utils";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";

interface CachedOGResponse {
  buffer: ArrayBuffer;
  createdAt: number;
}

const OG_RESPONSE_CACHE = new Map<string, CachedOGResponse>();
const COVER_IMAGE_CACHE = new Map<string, string>();
const MAX_OG_CACHE_ENTRIES = 60;
const OG_CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export const OG_HEADERS = {
  "Content-Type": "image/png",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Cross-Origin-Resource-Policy": "cross-origin",
  "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: OG_HEADERS,
  });
}

/**
 * Dynamic OG image generation with high-performance response caching.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const cacheKey = request.nextUrl.search || "?type=home";
  const cached = OG_RESPONSE_CACHE.get(cacheKey);

  if (cached && Date.now() - cached.createdAt < OG_CACHE_TTL_MS) {
    return new Response(cached.buffer, {
      status: 200,
      headers: {
        ...OG_HEADERS,
        "X-OG-Cache": "HIT",
      },
    });
  }

  try {
    const imageResponse = await generateOG(request);
    const buffer = await imageResponse.arrayBuffer();

    if (OG_RESPONSE_CACHE.size >= MAX_OG_CACHE_ENTRIES) {
      const firstKey = OG_RESPONSE_CACHE.keys().next().value;
      if (firstKey) OG_RESPONSE_CACHE.delete(firstKey);
    }

    OG_RESPONSE_CACHE.set(cacheKey, {
      buffer,
      createdAt: Date.now(),
    });

    return new Response(buffer, {
      status: 200,
      headers: {
        ...OG_HEADERS,
        "X-OG-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("[OG] Generation error:", error);
    return generateFallbackOG();
  }
}

async function generateOG(request: NextRequest): Promise<ImageResponse> {
  const { searchParams } = request.nextUrl;
  const slug = searchParams.get("slug");

  // ── Per-post / note mode ────────────────────────────────────────────────
  if (slug) {
    const service = new ContentService();
    const typeParam = searchParams.get("type");

    if (typeParam === "note") {
      try {
        const note = await service.getNote(slug);
        if (note && note.status !== "unpublished") {
          const personaLabel = note.persona
            ? (PERSONA_LABELS[note.persona] ?? note.persona)
            : "";
          const coverImageB64 = await resolveCoverImage(note.coverImage);
          return generatePostOG({
            title: note.title,
            description: note.subtitle || note.description || "",
            typeLabel: "Note",
            personaLabel,
            coverImageB64,
            hasCover: Boolean(coverImageB64),
          });
        }
      } catch {
        // fallback
      }
      return generateFallbackOG();
    }

    try {
      const post = await service.getPost(slug);
      if (post && post.status !== "unpublished") {
        const personaLabel = post.persona ? PERSONA_LABELS[post.persona] : "";
        const coverImageB64 = await resolveCoverImage(post.coverImage);

        return generatePostOG({
          title: post.title,
          description: post.subtitle || post.description || "",
          typeLabel: "Essay",
          personaLabel,
          coverImageB64,
          hasCover: Boolean(coverImageB64),
        });
      }

      const note = await service.getNote(slug);
      if (note && note.status !== "unpublished") {
        const personaLabel = note.persona
          ? (PERSONA_LABELS[note.persona] ?? note.persona)
          : "";
        const coverImageB64 = await resolveCoverImage(note.coverImage);
        return generatePostOG({
          title: note.title,
          description: note.subtitle || note.description || "",
          typeLabel: "Note",
          personaLabel,
          coverImageB64,
          hasCover: Boolean(coverImageB64),
        });
      }
    } catch {
      // fallback
    }

    return generateFallbackOG();
  }

  // ── Page-specific dynamic OG generation ─────────────────────────────────
  const type = searchParams.get("type") || "";

  if (type === "home") {
    let siteName = SITE_NAME;
    let greeting = "HI, I'M BIRANCHI";
    let headline =
      "I build things nobody asked for, and write about things I can't stop thinking about.";
    let supporting =
      "Learning, questioning, unlearning, and occasionally figuring things out";
    let heroImageSrc = "/biranchi.jpeg";

    try {
      const site = SITE_CONFIG;
      if (site?.identity?.name) siteName = site.identity.name;
      if (site?.hero?.greeting) greeting = site.hero.greeting;
      if (site?.hero?.headline) headline = site.hero.headline;
      if (site?.hero?.points?.length) supporting = site.hero.points[0];
      if (site?.hero?.image?.src) heroImageSrc = site.hero.image.src;
    } catch {
      // Use fallback
    }

    const heroImageB64 =
      (await resolveCoverImage("/og/biranchi.jpeg")) ||
      (await resolveCoverImage(heroImageSrc));

    return generateHomeOG({
      siteName,
      greeting,
      headline,
      supporting,
      heroImageB64,
    });
  }

  if (type === "support") {
    const title = "Help me keep this corner of the web independent.";
    const subtitle =
      "Everything I make here is open to everyone. No paywalls, ads, sponsored posts, or attention tricks.";

    return generateSupportOG({
      title,
      subtitle,
    });
  }

  if (type === "about") {
    let siteName = SITE_NAME;
    try {
      const site = SITE_CONFIG;
      if (site?.identity?.name) siteName = site.identity.name;
    } catch {
      // Use fallback
    }

    const description =
      searchParams.get("description") ||
      "A little about Biranchi Kulesika, his work, writing, interests, and the things he is learning along the way.";
    const images = await resolveAboutImages();
    return generateAboutOG({
      title: "About",
      description,
      images,
      siteName,
    });
  }

  if (type === "library") {
    let books: { id: string; title: string; author: string; cover?: string }[] =
      [];
    let title = "Library";
    let description =
      searchParams.get("description") ||
      "Books I've read, loved, and recommend for others to read.";
    let totalCount = 0;

    try {
      const service = new ContentService();
      const library = await service.getLibrary();
      if (library?.items?.length) {
        title = library.title || "Library";
        description =
          searchParams.get("description") ||
          "Books I've read, loved, and recommend for others to read.";
        books = selectBooksForOG(library.items);
        totalCount = library.items.length;
      }
    } catch {
      // Database unavailable, use curated defaults
    }

    if (books.length === 0) {
      books = [
        {
          id: "b1",
          title: "Thinking in Systems",
          author: "Donella H. Meadows",
          cover:
            "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80",
        },
        {
          id: "b2",
          title: "Crafting Interpreters",
          author: "Robert Nystrom",
          cover:
            "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&auto=format&fit=crop&q=80",
        },
        {
          id: "b3",
          title: "The Pragmatic Programmer",
          author: "David Thomas & Andrew Hunt",
          cover:
            "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&auto=format&fit=crop&q=80",
        },
      ];
      totalCount = books.length;
    }

    const coverImages = await resolveBookCovers(books);
    return generateLibraryOG({
      title,
      description,
      books,
      coverImages,
      totalCount,
    });
  }

  if (type === "scribble") {
    let entries: {
      id: string;
      title: string;
      description: string;
      type: string;
      date: string;
      persona?: string;
    }[] = [];
    const description =
      searchParams.get("description") || "Writing and thinking, shared openly.";
    let totalCount = 0;

    try {
      const service = new ContentService();
      const liveEntries = await service.getScribbleEntries();
      if (liveEntries?.length) {
        entries = liveEntries.slice(0, 3);
        totalCount = liveEntries.length;
      }
    } catch {
      // Database unavailable, use curated defaults
    }

    if (entries.length === 0) {
      entries = [
        {
          id: "s1",
          title: "On Simplicity and Systems",
          description:
            "Reflections on reducing cognitive friction and crafting software that lasts.",
          type: "essay",
          date: "",
          persona: "Builder",
        },
        {
          id: "s2",
          title: "Why we write things down",
          description:
            "Writing is not the artifact of thinking — writing is thinking itself.",
          type: "note",
          date: "",
          persona: "Thinker",
        },
        {
          id: "s3",
          title: "The craft of small tools",
          description:
            "Software built with care and restraint rather than runaway complexity.",
          type: "essay",
          date: "",
          persona: "Craftsman",
        },
      ];
      totalCount = entries.length;
    }

    return generateScribbleOG({
      title: "Scribble",
      description,
      entries,
      totalCount,
    });
  }

  if (type === "now") {
    let latestEntry: { title: string; content: string } | null = null;
    let entryCount = 1;
    const description =
      searchParams.get("description") ||
      "What I’m reading, exploring, working on, and thinking about these days.";

    try {
      const service = new ContentService();
      const entries = (await service.getNowEntries()).filter(
        (e) => e.status !== "unpublished",
      );
      if (entries?.length) {
        latestEntry = entries[0];
        entryCount = entries.length;
      }
    } catch {
      // Database unavailable, use curated default
    }

    if (!latestEntry) {
      latestEntry = {
        title: "Present Focus",
        content:
          "Reading philosophy, exploring systems thinking, building lightweight web craft, and thinking about technology outside the internet.",
      };
    }

    return generateNowOG({
      title: "Now",
      description,
      latestEntry,
      entryCount,
    });
  }

  // ── Generic fallback mode ───────────────────────────────────────────────
  const title = searchParams.get("title") || SITE_NAME;
  const description = searchParams.get("description") || "";
  const genericType = searchParams.get("type") || "home";
  const persona = searchParams.get("persona") || "";
  const coverUrl = searchParams.get("cover") || "";

  const typeLabel =
    genericType === "post" ? "Essay" : genericType === "note" ? "Note" : "";

  const coverImageB64 = coverUrl ? await resolveCoverImage(coverUrl) : null;

  return generatePostOG({
    title,
    description,
    typeLabel,
    personaLabel: persona,
    coverImageB64,
    hasCover: Boolean(coverImageB64),
    isHome: genericType === "home",
  });
}

// ── 0. Home page dynamic OG ─────────────────────────────────────────────────

function generateHomeOG({
  siteName,
  greeting,
  headline,
  supporting,
  heroImageB64,
}: {
  siteName: string;
  greeting: string;
  headline: string;
  supporting: string;
  heroImageB64: string | null;
}) {
  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "row",
        background: "#141413",
        color: "#FAF9F5",
        fontFamily: "serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "6px",
          background:
            "linear-gradient(90deg, #D97757 0%, #04A4BA 50%, #788C5D 100%)",
        }}
      />

      {/* Left text column */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: "0 0 58%",
          padding: "48px 56px 44px 60px",
          position: "relative",
        }}
      >
        {/* Top site identity */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "18px",
              fontFamily: "sans-serif",
              color: "#D97757",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              fontWeight: 600,
            }}
          >
            {siteName}
          </span>
        </div>

        {/* Headline & supporting text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "32px",
              fontStyle: "italic",
              fontFamily: "serif",
              color: "#D97757",
            }}
          >
            Hi, I’m Biranchi.
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "48px",
              fontWeight: 400,
              lineHeight: 1.14,
              letterSpacing: "-0.025em",
              color: "#FAF9F5",
              maxWidth: "580px",
            }}
          >
            {headline}
          </div>

          {supporting && (
            <div
              style={{
                display: "flex",
                fontSize: "22px",
                fontStyle: "italic",
                fontFamily: "serif",
                color: "#B0AEA5",
                lineHeight: 1.4,
                maxWidth: "540px",
              }}
            >
              {supporting}
            </div>
          )}
        </div>

        {/* Bottom branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "22px",
              fontFamily: "sans-serif",
              fontWeight: 600,
              color: "#FAF9F5",
              letterSpacing: "0.02em",
            }}
          >
            {SITE_DOMAIN}
          </span>
        </div>
      </div>

      {/* Right column — homepage hero photo presentation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 42%",
          position: "relative",
          paddingRight: "50px",
        }}
      >
        {/* Subtle background glow circle */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            width: "420px",
            height: "420px",
            borderRadius: "50%",
            background: "rgba(250,249,245,0.03)",
            border: "1px solid rgba(250,249,245,0.06)",
          }}
        />

        {heroImageB64 && (
          <div
            style={{
              display: "flex",
              width: "320px",
              height: "420px",
              borderRadius: "24px",
              overflow: "hidden",
              border: "2px solid rgba(250,249,245,0.2)",
              boxShadow: "0 24px 56px rgba(0,0,0,0.7)",
              position: "relative",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImageB64}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        )}
      </div>
    </div>,
    { width: 1200, height: 630, headers: OG_HEADERS },
  );
}

// ── Support page OG ─────────────────────────────────────────────────────────

function generateSupportOG({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "row",
        background: "#141413",
        color: "#FAF9F5",
        fontFamily: "serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "6px",
          background:
            "linear-gradient(90deg, #D97757 0%, #04A4BA 50%, #788C5D 100%)",
        }}
      />

      {/* Background faint watermark */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          right: "40px",
          bottom: "10px",
          fontSize: "190px",
          fontFamily: "serif",
          fontStyle: "italic",
          color: "rgba(250, 249, 245, 0.025)",
          letterSpacing: "-0.04em",
          userSelect: "none",
        }}
      >
        patronage
      </div>

      {/* Left text column */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: "0 0 52%",
          padding: "48px 56px 44px 60px",
          position: "relative",
        }}
      >
        {/* Top category badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "18px",
              fontFamily: "sans-serif",
              color: "#D97757",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              fontWeight: 600,
            }}
          >
            Support & Patronage
          </span>
        </div>

        {/* Title & subtitle */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "52px",
              fontWeight: 400,
              lineHeight: 1.12,
              letterSpacing: "-0.025em",
              color: "#FAF9F5",
              maxWidth: "520px",
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "22px",
              fontFamily: "sans-serif",
              color: "#B0AEA5",
              lineHeight: 1.45,
              maxWidth: "500px",
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* Bottom branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "22px",
              fontFamily: "sans-serif",
              fontWeight: 600,
              color: "#FAF9F5",
              letterSpacing: "0.02em",
            }}
          >
            {SITE_DOMAIN}
          </span>
        </div>
      </div>

      {/* Right column — unboxed, clean editorial ledger lines */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          flex: "0 0 48%",
          position: "relative",
          paddingRight: "56px",
          paddingLeft: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            width: "100%",
            maxWidth: "480px",
          }}
        >
          {/* Item 01 */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "22px",
              paddingBottom: "22px",
              borderBottom: "1px solid rgba(250, 249, 245, 0.08)",
            }}
          >
            <span
              style={{
                fontSize: "18px",
                fontFamily: "sans-serif",
                color: "#D97757",
                fontWeight: 600,
                letterSpacing: "0.1em",
                marginTop: "2px",
              }}
            >
              01
            </span>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <span
                style={{
                  fontSize: "26px",
                  fontFamily: "serif",
                  color: "#FAF9F5",
                  lineHeight: 1.2,
                }}
              >
                100% Free & Open Access
              </span>
              <span
                style={{
                  fontSize: "17px",
                  fontFamily: "sans-serif",
                  color: "#8A8780",
                  lineHeight: 1.35,
                }}
              >
                No paywalls, subscriptions, or gated essays
              </span>
            </div>
          </div>

          {/* Item 02 */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "22px",
              paddingBottom: "22px",
              borderBottom: "1px solid rgba(250, 249, 245, 0.08)",
            }}
          >
            <span
              style={{
                fontSize: "18px",
                fontFamily: "sans-serif",
                color: "#04A4BA",
                fontWeight: 600,
                letterSpacing: "0.1em",
                marginTop: "2px",
              }}
            >
              02
            </span>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <span
                style={{
                  fontSize: "26px",
                  fontFamily: "serif",
                  color: "#FAF9F5",
                  lineHeight: 1.2,
                }}
              >
                Zero Ads & Attention Tricks
              </span>
              <span
                style={{
                  fontSize: "17px",
                  fontFamily: "sans-serif",
                  color: "#8A8780",
                  lineHeight: 1.35,
                }}
              >
                No sponsorships, tracking pixels, or visual noise
              </span>
            </div>
          </div>

          {/* Item 03 */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "22px",
            }}
          >
            <span
              style={{
                fontSize: "18px",
                fontFamily: "sans-serif",
                color: "#788C5D",
                fontWeight: 600,
                letterSpacing: "0.1em",
                marginTop: "2px",
              }}
            >
              03
            </span>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <span
                style={{
                  fontSize: "26px",
                  fontFamily: "serif",
                  color: "#FAF9F5",
                  lineHeight: 1.2,
                }}
              >
                Direct Independent Craft
              </span>
              <span
                style={{
                  fontSize: "17px",
                  fontFamily: "sans-serif",
                  color: "#8A8780",
                  lineHeight: 1.35,
                }}
              >
                Sustaining servers, research books, tools, and code
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    { width: 1200, height: 630, headers: OG_HEADERS },
  );
}

// ── 1. About page dynamic OG ────────────────────────────────────────────────

const ABOUT_PAGE_IMAGES = [
  "/og/about-1.jpeg",
  "/og/about-2.jpeg",
  "/og/about-3.jpeg",
  "/og/about-4.jpeg",
];

const ABOUT_PAGE_FALLBACKS = [
  "/selfiewithmiku.jpeg",
  "/selfiewithblessie.jpeg",
  "/selfiewithfriends.jpeg",
  "/selfiewithbhabani.jpeg",
];

async function resolveAboutImages(): Promise<(string | null)[]> {
  return Promise.all(
    ABOUT_PAGE_IMAGES.map(async (src, i) => {
      const resolved = await resolveCoverImage(src);
      if (resolved) return resolved;
      const fallbackSrc = ABOUT_PAGE_FALLBACKS[i];
      return fallbackSrc ? resolveCoverImage(fallbackSrc) : null;
    }),
  );
}

function generateAboutOG({
  description,
  images,
  siteName,
}: {
  title: string;
  description: string;
  images: (string | null)[];
  siteName: string;
}) {
  const validImages = images.filter(Boolean) as string[];
  const desc =
    description ||
    "A little about Biranchi Kulesika, his work, writing, interests, and the things he is learning along the way.";

  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "row",
        background: "#141413",
        color: "#FAF9F5",
        fontFamily: "serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "6px",
          background:
            "linear-gradient(90deg, #D97757 0%, #04A4BA 50%, #788C5D 100%)",
        }}
      />

      {/* Left text column */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: "0 0 54%",
          padding: "48px 56px 44px 60px",
          position: "relative",
        }}
      >
        {/* Top category label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span
            style={{
              fontSize: "18px",
              fontFamily: "sans-serif",
              color: "#D97757",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              fontWeight: 600,
            }}
          >
            About
          </span>
          <div
            style={{
              display: "flex",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#78766E",
            }}
          />
          <span
            style={{
              fontSize: "18px",
              fontFamily: "sans-serif",
              color: "#B0AEA5",
              letterSpacing: "0.05em",
            }}
          >
            {siteName}
          </span>
        </div>

        {/* Headline and excerpt */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span
              style={{
                fontSize: "66px",
                fontWeight: 400,
                lineHeight: 1.05,
                letterSpacing: "-0.025em",
                color: "#FAF9F5",
              }}
            >
              This is me,
            </span>
            <span
              style={{
                fontSize: "56px",
                fontStyle: "italic",
                fontWeight: 400,
                lineHeight: 1.1,
                color: "#C5C3BB",
              }}
            >
              outside the internet
            </span>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "23px",
              fontFamily: "sans-serif",
              color: "#B0AEA5",
              lineHeight: 1.42,
              maxWidth: "520px",
            }}
          >
            {desc}
          </div>
        </div>

        {/* Bottom branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontSize: "22px",
              fontFamily: "sans-serif",
              fontWeight: 600,
              color: "#FAF9F5",
              letterSpacing: "0.02em",
            }}
          >
            {SITE_DOMAIN}
          </span>
        </div>
      </div>

      {/* Right column — angled 2-column image mosaic */}
      {validImages.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "0 0 46%",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* 2-column skewed grid */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              transform: "rotate(-4deg)",
              position: "relative",
            }}
          >
            {/* Column 1 (offset up) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                marginTop: "-34px",
              }}
            >
              {validImages.slice(0, 2).map((src, i) => (
                <div
                  key={`c1-${i}`}
                  style={{
                    width: "215px",
                    height: "265px",
                    borderRadius: "20px",
                    overflow: "hidden",
                    border: "2px solid rgba(250,249,245,0.18)",
                    background: "#1c1c1a",
                    position: "relative",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.45)",
                    display: "flex",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: "45%",
                      background:
                        "linear-gradient(180deg, transparent 0%, rgba(20,20,19,0.55) 100%)",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Column 2 (offset down) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                marginTop: "16px",
              }}
            >
              {(validImages.length >= 4
                ? validImages.slice(2, 4)
                : validImages.slice(0, 2)
              ).map((src, i) => (
                <div
                  key={`c2-${i}`}
                  style={{
                    width: "215px",
                    height: "265px",
                    borderRadius: "20px",
                    overflow: "hidden",
                    border: "2px solid rgba(250,249,245,0.18)",
                    background: "#1c1c1a",
                    position: "relative",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.45)",
                    display: "flex",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: "45%",
                      background:
                        "linear-gradient(180deg, transparent 0%, rgba(20,20,19,0.55) 100%)",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>,
    { width: 1200, height: 630, headers: OG_HEADERS },
  );
}

// ── 2. Library page dynamic OG ──────────────────────────────────────────────

function selectBooksForOG<
  T extends { id: string; featured?: boolean; cover?: string },
>(items: T[]): T[] {
  if (items.length === 0) return [];
  const withCovers = items.filter((b) => b.cover);
  const featured = items.filter((b) => b.featured);
  const pool =
    withCovers.length >= 3
      ? withCovers
      : featured.length >= 3
        ? featured
        : items;
  const count = Math.min(3, pool.length);
  const today = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash + today.charCodeAt(i)) | 0;
  }
  const start = Math.abs(hash) % Math.max(1, pool.length - count + 1);
  return pool.slice(start, start + count);
}

const DEFAULT_BOOK_COVERS = [
  "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1532012164546-f432f2e3edd7?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&auto=format&fit=crop&q=80",
];

async function resolveBookCovers(
  books: { cover?: string; id: string }[],
): Promise<(string | null)[]> {
  return Promise.all(
    books.map(async (b, i) => {
      if (b.cover) {
        const resolved = await resolveCoverImage(b.cover);
        if (resolved) return resolved;
      }
      // Guaranteed fallback to high-quality book artwork image
      const fallbackUrl = DEFAULT_BOOK_COVERS[i % DEFAULT_BOOK_COVERS.length];
      return resolveCoverImage(fallbackUrl);
    }),
  );
}

function generateLibraryOG({
  title,
  description,
  books,
  coverImages,
  totalCount,
}: {
  title: string;
  description: string;
  books: { title: string; author: string; id: string }[];
  coverImages: (string | null)[];
  totalCount: number;
}) {
  const desc =
    description || "Books I've read, loved, and recommend for others to read.";

  const rotations = [-7, 0, 7];

  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "row",
        background: "#141413",
        color: "#FAF9F5",
        fontFamily: "serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "6px",
          background:
            "linear-gradient(90deg, #D97757 0%, #04A4BA 50%, #788C5D 100%)",
        }}
      />

      {/* Left text column */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: "0 0 52%",
          padding: "48px 56px 44px 60px",
          position: "relative",
        }}
      >
        {/* Top category label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span
            style={{
              fontSize: "18px",
              fontFamily: "sans-serif",
              color: "#D97757",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              fontWeight: 600,
            }}
          >
            Library
          </span>
          <div
            style={{
              display: "flex",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#78766E",
            }}
          />
          <span
            style={{
              fontSize: "18px",
              fontFamily: "sans-serif",
              color: "#B0AEA5",
              letterSpacing: "0.05em",
            }}
          >
            {totalCount > 0
              ? `${totalCount} Curated Titles`
              : "Reading Catalog"}
          </span>
        </div>

        {/* Title and description */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "76px",
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              color: "#FAF9F5",
            }}
          >
            {title || "Library"}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "24px",
              fontFamily: "sans-serif",
              color: "#B0AEA5",
              lineHeight: 1.42,
              maxWidth: "500px",
            }}
          >
            {desc}
          </div>
        </div>

        {/* Bottom branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "22px",
              fontFamily: "sans-serif",
              fontWeight: 600,
              color: "#FAF9F5",
              letterSpacing: "0.02em",
            }}
          >
            {SITE_DOMAIN}
          </span>
        </div>
      </div>

      {/* Right column — 3D layered book covers */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 48%",
          position: "relative",
          paddingRight: "44px",
        }}
      >
        {/* Layered books row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            position: "relative",
          }}
        >
          {books.map((book, i) => {
            const img = coverImages[i];
            const rotation = rotations[i] ?? 0;

            return (
              <div
                key={book.id}
                style={{
                  width: "185px",
                  height: "275px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "1px solid rgba(250,249,245,0.18)",
                  borderLeft: "4px solid rgba(250,249,245,0.35)",
                  background: "#1e1e1c",
                  boxShadow: "0 24px 48px rgba(0,0,0,0.65)",
                  position: "relative",
                  transform: `rotate(${rotation}deg)`,
                  display: "flex",
                }}
              >
                {img ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={img}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  /* Editorial book spine fallback */
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      padding: "20px",
                      background:
                        "linear-gradient(145deg, #262522 0%, #171715 100%)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        fontSize: "14px",
                        fontFamily: "sans-serif",
                        color: "#D97757",
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        fontWeight: 600,
                      }}
                    >
                      Book
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "serif",
                          fontSize: "19px",
                          fontStyle: "italic",
                          lineHeight: 1.25,
                          color: "#FAF9F5",
                        }}
                      >
                        {book.title}
                      </span>
                      <span
                        style={{
                          fontFamily: "sans-serif",
                          fontSize: "14px",
                          color: "#B0AEA5",
                        }}
                      >
                        {book.author}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    { width: 1200, height: 630, headers: OG_HEADERS },
  );
}

// ── 3. Scribble page dynamic OG ─────────────────────────────────────────────

function generateScribbleOG({
  title,
  description,
  entries,
  totalCount,
}: {
  title: string;
  description: string;
  entries: {
    title: string;
    description: string;
    type: string;
    date: string;
    persona?: string;
    coverImage?: string;
    id: string;
  }[];
  totalCount: number;
}) {
  const desc = description || "Writing and thinking, shared openly.";
  const featured = entries.slice(0, 3);

  const cardAccents = [
    { borderLeft: "5px solid #D97757", color: "#D97757", rot: -2.5 },
    { borderLeft: "5px solid #04A4BA", color: "#04A4BA", rot: 1.5 },
    { borderLeft: "5px solid #788C5D", color: "#788C5D", rot: -1.0 },
  ];

  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "row",
        background: "#141413",
        color: "#FAF9F5",
        fontFamily: "serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "6px",
          background:
            "linear-gradient(90deg, #D97757 0%, #04A4BA 50%, #788C5D 100%)",
        }}
      />

      {/* Left text column */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: "0 0 48%",
          padding: "48px 56px 44px 60px",
          position: "relative",
        }}
      >
        {/* Top category label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span
            style={{
              fontSize: "18px",
              fontFamily: "sans-serif",
              color: "#D97757",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              fontWeight: 600,
            }}
          >
            Scribble
          </span>
          <div
            style={{
              display: "flex",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#78766E",
            }}
          />
          <span
            style={{
              fontSize: "18px",
              fontFamily: "sans-serif",
              color: "#B0AEA5",
              letterSpacing: "0.05em",
            }}
          >
            {totalCount > 0 ? `${totalCount} Entries` : "Digital Garden"}
          </span>
        </div>

        {/* Title and description */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "76px",
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              color: "#FAF9F5",
            }}
          >
            {title || "Scribble"}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "24px",
              fontFamily: "sans-serif",
              color: "#B0AEA5",
              lineHeight: 1.42,
              maxWidth: "480px",
            }}
          >
            {desc}
          </div>
        </div>

        {/* Bottom branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "22px",
              fontFamily: "sans-serif",
              fontWeight: 600,
              color: "#FAF9F5",
              letterSpacing: "0.02em",
            }}
          >
            {SITE_DOMAIN}
          </span>
        </div>
      </div>

      {/* Right column — dynamic editorial ledger card composition */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 52%",
          position: "relative",
          paddingRight: "44px",
        }}
      >
        {/* Staggered layered ledger cards */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            width: "100%",
            maxWidth: "520px",
            position: "relative",
          }}
        >
          {featured.map((entry, i) => {
            const accent = cardAccents[i] || cardAccents[0];
            const snippet = entry.description
              ? textSnippet(entry.description, 90)
              : "";

            return (
              <div
                key={entry.id || i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  background: "#191917",
                  border: "1px solid rgba(250,249,245,0.13)",
                  borderLeft: accent.borderLeft,
                  borderRadius: "14px",
                  padding: "18px 22px",
                  boxShadow: "0 16px 36px rgba(0,0,0,0.55)",
                  transform: `rotate(${accent.rot}deg)`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "6px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      fontFamily: "sans-serif",
                      color: accent.color,
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      fontWeight: 600,
                    }}
                  >
                    {entry.type === "essay" ? "Essay" : "Atomic Note"}
                  </span>
                  {entry.persona && (
                    <span
                      style={{
                        fontSize: "14px",
                        fontFamily: "sans-serif",
                        color: "#8A8780",
                        textTransform: "capitalize",
                      }}
                    >
                      · {entry.persona}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    fontSize: "22px",
                    fontFamily: "serif",
                    lineHeight: 1.25,
                    color: "#FAF9F5",
                    marginBottom: snippet ? "6px" : "0",
                  }}
                >
                  {entry.title}
                </div>

                {snippet && (
                  <div
                    style={{
                      display: "flex",
                      fontSize: "16px",
                      fontFamily: "sans-serif",
                      color: "#9E9C94",
                      lineHeight: 1.35,
                    }}
                  >
                    {snippet}…
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    { width: 1200, height: 630, headers: OG_HEADERS },
  );
}

// ── 4. Now page dynamic OG ──────────────────────────────────────────────────

function generateNowOG({
  title,
  description,
  latestEntry,
  entryCount,
}: {
  title: string;
  description: string;
  latestEntry: { title: string; content: string } | null;
  entryCount: number;
}) {
  const desc =
    description ||
    "What I’m reading, exploring, working on, and thinking about these days.";

  // Extract snippet from latest entry content
  const contentSnippet = latestEntry
    ? textSnippet(latestEntry.content, 130)
    : "";

  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "row",
        background: "#141413",
        color: "#FAF9F5",
        fontFamily: "serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "6px",
          background:
            "linear-gradient(90deg, #D97757 0%, #04A4BA 50%, #788C5D 100%)",
        }}
      />

      {/* Left text column */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: "0 0 52%",
          padding: "48px 56px 44px 60px",
          position: "relative",
        }}
      >
        {/* Top live pulse label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "11px",
              height: "11px",
              borderRadius: "50%",
              background: "#04A4BA",
            }}
          />
          <span
            style={{
              fontSize: "18px",
              fontFamily: "sans-serif",
              color: "#04A4BA",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              fontWeight: 600,
            }}
          >
            Now
          </span>
          <div
            style={{
              display: "flex",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#78766E",
            }}
          />
          <span
            style={{
              fontSize: "18px",
              fontFamily: "sans-serif",
              color: "#B0AEA5",
              letterSpacing: "0.05em",
            }}
          >
            {latestEntry ? `Updated ${latestEntry.title}` : "Live Timeline"}
          </span>
        </div>

        {/* Title and description */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "76px",
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              color: "#FAF9F5",
            }}
          >
            {title || "Now"}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "24px",
              fontFamily: "sans-serif",
              color: "#B0AEA5",
              lineHeight: 1.42,
              maxWidth: "500px",
            }}
          >
            {desc}
          </div>
        </div>

        {/* Bottom branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "22px",
              fontFamily: "sans-serif",
              fontWeight: 600,
              color: "#FAF9F5",
              letterSpacing: "0.02em",
            }}
          >
            {SITE_DOMAIN}
          </span>
        </div>
      </div>

      {/* Right column — dynamic timeline & telemetry card */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 48%",
          position: "relative",
          paddingRight: "50px",
        }}
      >
        {/* Timeline visualization */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            width: "100%",
            maxWidth: "480px",
            position: "relative",
          }}
        >
          {/* Active latest entry card */}
          {latestEntry && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                background: "#1c1c1a",
                border: "2px solid rgba(4,164,186,0.35)",
                borderRadius: "18px",
                padding: "26px 28px",
                boxShadow: "0 20px 44px rgba(0,0,0,0.55)",
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: "15px",
                    fontFamily: "sans-serif",
                    color: "#04A4BA",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  Current Update
                </span>
                <span
                  style={{
                    fontSize: "15px",
                    fontFamily: "sans-serif",
                    color: "#B0AEA5",
                  }}
                >
                  {latestEntry.title}
                </span>
              </div>

              {contentSnippet && (
                <div
                  style={{
                    display: "flex",
                    fontSize: "20px",
                    fontFamily: "sans-serif",
                    color: "#FAF9F5",
                    lineHeight: 1.45,
                  }}
                >
                  {contentSnippet}…
                </div>
              )}
            </div>
          )}

          {/* Timeline nodes row below */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              paddingLeft: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "#04A4BA",
              }}
            />
            <div
              style={{
                display: "flex",
                height: "3px",
                width: "65px",
                background: "rgba(250,249,245,0.15)",
              }}
            />
            <div
              style={{
                display: "flex",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "rgba(250,249,245,0.2)",
              }}
            />
            <div
              style={{
                display: "flex",
                height: "3px",
                width: "45px",
                background: "rgba(250,249,245,0.1)",
              }}
            />
            <div
              style={{
                display: "flex",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "rgba(250,249,245,0.15)",
              }}
            />
            <span
              style={{
                fontSize: "15px",
                fontFamily: "sans-serif",
                color: "#8A8780",
                marginLeft: "10px",
              }}
            >
              {entryCount} updates recorded
            </span>
          </div>
        </div>

        {/* Faint watermark typography in background */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            right: "24px",
            bottom: "16px",
            fontSize: "180px",
            fontWeight: 400,
            lineHeight: 1,
            color: "rgba(250,249,245,0.025)",
            fontFamily: "serif",
            letterSpacing: "-0.05em",
            userSelect: "none",
          }}
        >
          now
        </div>
      </div>
    </div>,
    { width: 1200, height: 630, headers: OG_HEADERS },
  );
}

// ── Cover image resolution (SSRF-protected + local file fallback) ───────────

function isAllowedCoverHost(hostname: string): boolean {
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "169.254.169.254" ||
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("172.") ||
    hostname === "::1" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    return false;
  }
  return true;
}

async function resolveCoverImage(
  coverImage: string | undefined,
): Promise<string | null> {
  if (!coverImage || typeof coverImage !== "string") return null;
  const trimmed = coverImage.trim();
  if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("/\\"))
    return null;

  if (COVER_IMAGE_CACHE.has(trimmed)) {
    return COVER_IMAGE_CACHE.get(trimmed)!;
  }

  // 1. Try resolving local files directly from public directory
  if (trimmed.startsWith("/")) {
    try {
      const cleanPath = trimmed.replace(/^\/+/, "");
      const localFilePath = path.join(process.cwd(), "public", cleanPath);
      if (fs.existsSync(localFilePath)) {
        const ext = path.extname(localFilePath).toLowerCase();
        const mime =
          ext === ".png"
            ? "image/png"
            : ext === ".webp"
              ? "image/webp"
              : ext === ".svg"
                ? "image/svg+xml"
                : "image/jpeg";
        const buffer = await fs.promises.readFile(localFilePath);
        if (buffer.byteLength <= 5 * 1024 * 1024) {
          const b64 = `data:${mime};base64,${buffer.toString("base64")}`;
          COVER_IMAGE_CACHE.set(trimmed, b64);
          return b64;
        }
      }
    } catch {
      // fallback to remote fetch
    }
  }

  // 2. Remote URL fetch
  try {
    let targetUrl: string;

    if (trimmed.startsWith("/")) {
      targetUrl = `${SITE_URL}${trimmed}`;
    } else {
      const parsed = new URL(trimmed);
      if (
        parsed.protocol !== "https:" &&
        (process.env.NODE_ENV !== "development" || parsed.protocol !== "http:")
      ) {
        return null;
      }
      if (!isAllowedCoverHost(parsed.hostname)) {
        return null;
      }
      targetUrl = trimmed;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(targetUrl, {
      signal: controller.signal,
      next: { revalidate: 86400 },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.startsWith("image/")) {
        return null;
      }
      const buf = await res.arrayBuffer();
      if (buf.byteLength > 5 * 1024 * 1024) {
        return null;
      }
      const b64 = `data:${contentType};base64,${Buffer.from(buf).toString("base64")}`;
      COVER_IMAGE_CACHE.set(trimmed, b64);
      return b64;
    }
  } catch {
    // If cover fetch fails or is aborted, proceed without artwork
  }
  return null;
}

// ── OG image generation (post/note/default) ──────────────────────────────────

interface PostOGParams {
  title: string;
  description: string;
  typeLabel: string;
  personaLabel: string;
  coverImageB64: string | null;
  hasCover: boolean;
  isHome?: boolean;
}

function generatePostOG({
  title,
  description,
  typeLabel,
  personaLabel,
  coverImageB64,
  hasCover,
  isHome = false,
}: PostOGParams) {
  const displayTitle = title.length > 80 ? title.slice(0, 77) + "…" : title;
  const cleanedDescription = stripMarkdown(description);
  const displayDescription =
    cleanedDescription.length > 120
      ? cleanedDescription.slice(0, 117) + "…"
      : cleanedDescription;

  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "row",
        background: "#141413",
        color: "#FAF9F5",
        fontFamily: "serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "6px",
          background:
            "linear-gradient(90deg, #D97757 0%, #04A4BA 50%, #788C5D 100%)",
        }}
      />

      {/* Left text column */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: hasCover ? "0 0 60%" : "1 1 100%",
          position: "relative",
        }}
      >
        {/* Top bar: Type + Persona */}
        {(typeLabel || personaLabel) && (
          <div
            style={{
              padding: "48px 64px 0",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span
              style={{
                fontSize: "18px",
                fontFamily: "sans-serif",
                color: "#D97757",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                fontWeight: 600,
              }}
            >
              {typeLabel}
            </span>
            {typeLabel && personaLabel && (
              <div
                style={{
                  display: "flex",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#78766E",
                }}
              />
            )}
            {personaLabel && (
              <span
                style={{
                  fontSize: "18px",
                  fontFamily: "sans-serif",
                  color: "#D97757",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  fontWeight: 600,
                }}
              >
                {personaLabel}
              </span>
            )}
          </div>
        )}

        {/* Title + Description area */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            padding: "0 64px",
          }}
        >
          {/* Title */}
          <div
            style={{
              display: "flex",
              fontSize: isHome ? "86px" : (hasCover ? "68px" : "76px"),
              fontWeight: 400,
              lineHeight: 1.08,
              letterSpacing: "-0.025em",
              maxWidth: hasCover ? "620px" : "1000px",
            }}
          >
            {displayTitle}
          </div>

          {/* Description */}
          {displayDescription && (
            <div
              style={{
                display: "flex",
                fontSize: "25px",
                fontFamily: "sans-serif",
                color: "#B0AEA5",
                marginTop: "20px",
                maxWidth: hasCover ? "560px" : "960px",
                lineHeight: 1.4,
              }}
            >
              {displayDescription}
            </div>
          )}
        </div>

        {/* Bottom bar: domain */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 64px 44px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "22px",
              fontFamily: "sans-serif",
              fontWeight: 600,
              color: "#FAF9F5",
            }}
          >
            {SITE_DOMAIN}
          </div>
        </div>
      </div>

      {/* Right artwork column — only when cover is provided */}
      {hasCover && coverImageB64 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "0 0 40%",
            padding: "44px 56px 44px 0",
            position: "relative",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImageB64}
            alt=""
            style={{
              maxWidth: "92%",
              maxHeight: "88%",
              objectFit: "contain",
              position: "relative",
            }}
          />
        </div>
      )}
    </div>,
    {
      width: 1200,
      height: 630,
      headers: OG_HEADERS,
    },
  );
}

function generateFallbackOG() {
  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "48px 64px 44px",
        background: "#141413",
        color: "#FAF9F5",
        fontFamily: "serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "6px",
          background:
            "linear-gradient(90deg, #D97757 0%, #04A4BA 50%, #788C5D 100%)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: "92px",
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
          }}
        >
          {SITE_NAME}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: "24px",
            fontFamily: "sans-serif",
            fontWeight: 600,
            color: "#FAF9F5",
          }}
        >
          {SITE_DOMAIN}
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: OG_HEADERS,
    },
  );
}

