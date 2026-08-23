import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { ContentService } from '@/lib/services/content.service';
import { SITE_URL, SITE_NAME, SITE_DOMAIN, PERSONA_LABELS } from '@/lib/constants';

/**
 * Dynamic OG image generation.
 *
 * Modes:
 *   1. With ?slug=<post-slug>: Resolves the post/note via the service layer,
 *      fetches its cover artwork, and generates a composed 1200×630 image.
 *   2. With ?type=about|library|scribble|now: Generates page-specific OG
 *      images that pull live data from the content layer.
 *   3. Without slug or page type: Generates a default OG image using
 *      query params (title, description, type).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const slug = searchParams.get('slug');

  // ── Per-post / note mode ────────────────────────────────────────────────
  if (slug) {
    const service = new ContentService();
    const typeParam = searchParams.get('type');

    if (typeParam === 'note') {
      const note = await service.getNote(slug);
      if (!note) return generateFallbackOG();
      const personaLabel = note.persona ? (PERSONA_LABELS[note.persona] ?? note.persona) : '';
      const coverImageB64 = await resolveCoverImage(note.coverImage);
      return generatePostOG({
        title: note.title,
        description: note.subtitle || note.description || '',
        typeLabel: 'Note',
        personaLabel,
        coverImageB64,
        hasCover: Boolean(coverImageB64),
      });
    }

    const post = await service.getPost(slug);

    if (post) {
      const personaLabel = post.persona ? PERSONA_LABELS[post.persona] : '';
      const coverImageB64 = await resolveCoverImage(post.coverImage);

      return generatePostOG({
        title: post.title,
        description: post.subtitle || post.description || '',
        typeLabel: 'Essay',
        personaLabel,
        coverImageB64,
        hasCover: Boolean(coverImageB64),
      });
    }

    const note = await service.getNote(slug);
    if (note) {
      const personaLabel = note.persona ? (PERSONA_LABELS[note.persona] ?? note.persona) : '';
      const coverImageB64 = await resolveCoverImage(note.coverImage);
      return generatePostOG({
        title: note.title,
        description: note.subtitle || note.description || '',
        typeLabel: 'Note',
        personaLabel,
        coverImageB64,
        hasCover: Boolean(coverImageB64),
      });
    }

    return generateFallbackOG();
  }

  // ── Page-specific dynamic OG generation ─────────────────────────────────
  const type = searchParams.get('type') || '';

  if (type === 'about') {
    try {
      const service = new ContentService();
      const site = service.getSiteContent();
      const description = searchParams.get('description') || '';
      const images = await resolveAboutImages();
      return generateAboutOG({
        title: 'About',
        description,
        images,
        siteName: site.identity.name,
      });
    } catch {
      return generateFallbackOG();
    }
  }

  if (type === 'library') {
    try {
      const service = new ContentService();
      const library = await service.getLibrary();
      const description = searchParams.get('description') || '';
      const books = selectBooksForOG(library.items);
      const coverImages = await resolveBookCovers(books);
      return generateLibraryOG({
        title: library.title,
        description,
        books,
        coverImages,
        totalCount: library.items.length,
      });
    } catch {
      return generateFallbackOG();
    }
  }

  if (type === 'scribble') {
    try {
      const service = new ContentService();
      const entries = await service.getScribbleEntries();
      const description = searchParams.get('description') || '';
      return generateScribbleOG({
        title: 'Scribble',
        description,
        entries: entries.slice(0, 4),
        totalCount: entries.length,
      });
    } catch {
      return generateFallbackOG();
    }
  }

  if (type === 'now') {
    try {
      const service = new ContentService();
      const entries = await service.getNowEntries();
      const description = searchParams.get('description') || '';
      const latestEntry = entries.length > 0 ? entries[0] : null;
      return generateNowOG({
        title: 'Now',
        description,
        latestEntry,
        entryCount: entries.length,
      });
    } catch {
      return generateFallbackOG();
    }
  }

  // ── Generic fallback mode ───────────────────────────────────────────────
  const title = searchParams.get('title') || SITE_NAME;
  const description = searchParams.get('description') || '';
  const genericType = searchParams.get('type') || 'home';
  const persona = searchParams.get('persona') || '';
  const coverUrl = searchParams.get('cover') || '';

  const typeLabel =
    genericType === 'post' ? 'Essay' : genericType === 'note' ? 'Note' : '';

  const coverImageB64 = coverUrl ? await resolveCoverImage(coverUrl) : null;

  return generatePostOG({
    title,
    description,
    typeLabel,
    personaLabel: persona,
    coverImageB64,
    hasCover: Boolean(coverImageB64),
    isHome: genericType === 'home',
  });
}

// ── 1. About page dynamic OG ────────────────────────────────────────────────

const ABOUT_PAGE_IMAGES = [
  '/selfiewithmiku.jpeg',
  '/selfiewithblessie.jpeg',
  '/selfiewithfriends.jpeg',
  '/selfiewithbhabani.jpeg',
];

async function resolveAboutImages(): Promise<(string | null)[]> {
  return Promise.all(ABOUT_PAGE_IMAGES.map((src) => resolveCoverImage(src)));
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
    'Aspiring software developer by day, cybersecurity enthusiast by night, and student of philosophy.';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'row',
          background: '#141413',
          color: '#FAF9F5',
          fontFamily: 'serif',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background:
              'linear-gradient(90deg, #D97757 0%, #04A4BA 50%, #788C5D 100%)',
          }}
        />

        {/* Left text column */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: '0 0 54%',
            padding: '52px 64px 48px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Top category label */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span
              style={{
                fontSize: '14px',
                fontFamily: 'sans-serif',
                color: '#D97757',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                fontWeight: 600,
              }}
            >
              About
            </span>
            <span style={{ fontSize: '12px', color: '#555550' }}>✦</span>
            <span
              style={{
                fontSize: '14px',
                fontFamily: 'sans-serif',
                color: '#B0AEA5',
                letterSpacing: '0.05em',
              }}
            >
              {siteName}
            </span>
          </div>

          {/* Headline and excerpt */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span
                style={{
                  fontSize: '56px',
                  fontWeight: 400,
                  lineHeight: 1.05,
                  letterSpacing: '-0.025em',
                  color: '#FAF9F5',
                }}
              >
                This is me,
              </span>
              <span
                style={{
                  fontSize: '48px',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  lineHeight: 1.1,
                  color: '#C5C3BB',
                }}
              >
                outside the internet
              </span>
            </div>

            <div
              style={{
                fontSize: '19px',
                fontFamily: 'sans-serif',
                color: '#B0AEA5',
                lineHeight: 1.45,
                maxWidth: '480px',
              }}
            >
              {desc}
            </div>
          </div>

          {/* Bottom branding */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                fontSize: '17px',
                fontFamily: 'sans-serif',
                fontWeight: 600,
                color: '#FAF9F5',
                letterSpacing: '0.02em',
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: '0 0 46%',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Soft background radial glow */}
            <div
              style={{
                position: 'absolute',
                width: '450px',
                height: '450px',
                borderRadius: '50%',
                background:
                  'radial-gradient(circle, rgba(4,164,186,0.1) 0%, rgba(217,119,87,0.05) 50%, transparent 70%)',
              }}
            />

            {/* 2-column skewed grid */}
            <div
              style={{
                display: 'flex',
                gap: '14px',
                transform: 'rotate(-4deg)',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {/* Column 1 (offset up) */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  marginTop: '-30px',
                }}
              >
                {validImages.slice(0, 2).map((src, i) => (
                  <div
                    key={`c1-${i}`}
                    style={{
                      width: '185px',
                      height: '235px',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      border: '1px solid rgba(250,249,245,0.12)',
                      background: '#1c1c1a',
                      position: 'relative',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                      display: 'flex',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '45%',
                        background:
                          'linear-gradient(180deg, transparent 0%, rgba(20,20,19,0.55) 100%)',
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Column 2 (offset down) */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  marginTop: '15px',
                }}
              >
                {(validImages.length >= 4
                  ? validImages.slice(2, 4)
                  : validImages.slice(0, 2)
                ).map((src, i) => (
                  <div
                    key={`c2-${i}`}
                    style={{
                      width: '185px',
                      height: '235px',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      border: '1px solid rgba(250,249,245,0.12)',
                      background: '#1c1c1a',
                      position: 'relative',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                      display: 'flex',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '45%',
                        background:
                          'linear-gradient(180deg, transparent 0%, rgba(20,20,19,0.55) 100%)',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

// ── 2. Library page dynamic OG ──────────────────────────────────────────────

function selectBooksForOG<T extends { id: string; featured?: boolean }>(
  items: T[],
): T[] {
  if (items.length === 0) return [];
  const featured = items.filter((b) => b.featured);
  const pool = featured.length >= 3 ? featured : items;
  const count = Math.min(3, pool.length);
  const today = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash + today.charCodeAt(i)) | 0;
  }
  const start = Math.abs(hash) % Math.max(1, pool.length - count + 1);
  return pool.slice(start, start + count);
}

async function resolveBookCovers(
  books: { cover?: string; id: string }[],
): Promise<(string | null)[]> {
  return Promise.all(books.map((b) => resolveCoverImage(b.cover)));
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
    description || 'Books I’ve read, loved, and think are worth recommending.';

  const rotations = [-7, 0, 7];

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'row',
          background: '#141413',
          color: '#FAF9F5',
          fontFamily: 'serif',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background:
              'linear-gradient(90deg, #D97757 0%, #04A4BA 50%, #788C5D 100%)',
          }}
        />

        {/* Left text column */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: '0 0 52%',
            padding: '52px 64px 48px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Top category label */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span
              style={{
                fontSize: '14px',
                fontFamily: 'sans-serif',
                color: '#D97757',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                fontWeight: 600,
              }}
            >
              Library
            </span>
            <span style={{ fontSize: '12px', color: '#555550' }}>✦</span>
            <span
              style={{
                fontSize: '14px',
                fontFamily: 'sans-serif',
                color: '#B0AEA5',
                letterSpacing: '0.05em',
              }}
            >
              {totalCount > 0 ? `${totalCount} Curated Titles` : 'Reading Catalog'}
            </span>
          </div>

          {/* Title and description */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div
              style={{
                fontSize: '64px',
                fontWeight: 400,
                lineHeight: 1.05,
                letterSpacing: '-0.025em',
                color: '#FAF9F5',
              }}
            >
              {title || 'Library'}
            </div>

            <div
              style={{
                fontSize: '20px',
                fontFamily: 'sans-serif',
                color: '#B0AEA5',
                lineHeight: 1.45,
                maxWidth: '460px',
              }}
            >
              {desc}
            </div>
          </div>

          {/* Bottom branding */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '17px',
                fontFamily: 'sans-serif',
                fontWeight: 600,
                color: '#FAF9F5',
                letterSpacing: '0.02em',
              }}
            >
              {SITE_DOMAIN}
            </span>
          </div>
        </div>

        {/* Right column — 3D layered book covers */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: '0 0 48%',
            position: 'relative',
            paddingRight: '48px',
          }}
        >
          {/* Subtle warm glow behind book stack */}
          <div
            style={{
              position: 'absolute',
              width: '420px',
              height: '420px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(217,119,87,0.12) 0%, transparent 70%)',
            }}
          />

          {/* Layered books row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {books.map((book, i) => {
              const img = coverImages[i];
              const rotation = rotations[i] ?? 0;
              const zIndex = i === 1 ? 3 : i === 2 ? 2 : 1;

              return (
                <div
                  key={book.id}
                  style={{
                    width: '160px',
                    height: '240px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid rgba(250,249,245,0.15)',
                    borderLeft: '3px solid rgba(250,249,245,0.3)',
                    background: '#1e1e1c',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                    position: 'relative',
                    transform: `rotate(${rotation}deg)`,
                    zIndex,
                    display: 'flex',
                  }}
                >
                  {img ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={img}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    /* Editorial book spine fallback */
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '16px',
                        background:
                          'linear-gradient(145deg, #262522 0%, #171715 100%)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          fontFamily: 'sans-serif',
                          color: '#D97757',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                        }}
                      >
                        Book
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'serif',
                            fontSize: '15px',
                            fontStyle: 'italic',
                            lineHeight: 1.25,
                            color: '#FAF9F5',
                          }}
                        >
                          {book.title}
                        </span>
                        <span
                          style={{
                            fontFamily: 'sans-serif',
                            fontSize: '11px',
                            color: '#B0AEA5',
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
      </div>
    ),
    { width: 1200, height: 630 },
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
  const desc =
    description ||
    'Writing and thinking, shared openly. Essays, observations, and atomic notes on software, systems, and craft.';
  const featured = entries.slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'row',
          background: '#141413',
          color: '#FAF9F5',
          fontFamily: 'serif',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background:
              'linear-gradient(90deg, #D97757 0%, #04A4BA 50%, #788C5D 100%)',
          }}
        />

        {/* Left text column */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: '0 0 50%',
            padding: '52px 64px 48px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Top category label */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span
              style={{
                fontSize: '14px',
                fontFamily: 'sans-serif',
                color: '#D97757',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                fontWeight: 600,
              }}
            >
              Scribble
            </span>
            <span style={{ fontSize: '12px', color: '#555550' }}>✦</span>
            <span
              style={{
                fontSize: '14px',
                fontFamily: 'sans-serif',
                color: '#B0AEA5',
                letterSpacing: '0.05em',
              }}
            >
              {totalCount > 0 ? `${totalCount} Entries` : 'Digital Garden'}
            </span>
          </div>

          {/* Title and description */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div
              style={{
                fontSize: '64px',
                fontWeight: 400,
                lineHeight: 1.05,
                letterSpacing: '-0.025em',
                color: '#FAF9F5',
              }}
            >
              {title || 'Scribble'}
            </div>

            <div
              style={{
                fontSize: '20px',
                fontFamily: 'sans-serif',
                color: '#B0AEA5',
                lineHeight: 1.45,
                maxWidth: '460px',
              }}
            >
              {desc}
            </div>
          </div>

          {/* Bottom branding */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '17px',
                fontFamily: 'sans-serif',
                fontWeight: 600,
                color: '#FAF9F5',
                letterSpacing: '0.02em',
              }}
            >
              {SITE_DOMAIN}
            </span>
          </div>
        </div>

        {/* Right column — dynamic ledger cards stack */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: '0 0 50%',
            position: 'relative',
            paddingRight: '56px',
          }}
        >
          {/* Subtle teal background glow */}
          <div
            style={{
              position: 'absolute',
              width: '440px',
              height: '440px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(4,164,186,0.1) 0%, transparent 70%)',
            }}
          />

          {/* Staggered layered ledger cards */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              width: '100%',
              maxWidth: '440px',
              position: 'relative',
              zIndex: 1,
              transform: 'rotate(-2deg)',
            }}
          >
            {featured.map((entry, i) => (
              <div
                key={entry.id || i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: '#1c1c1a',
                  border: '1px solid rgba(250,249,245,0.12)',
                  borderRadius: '14px',
                  padding: '18px 22px',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.4)',
                  transform: `rotate(${[-1, 1.5, -0.5][i] || 0}deg)`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'sans-serif',
                        color: entry.type === 'essay' ? '#D97757' : '#04A4BA',
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                        fontWeight: 600,
                      }}
                    >
                      {entry.type === 'essay' ? 'Essay' : 'Atomic Note'}
                    </span>
                    {entry.persona && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontFamily: 'sans-serif',
                          color: '#B0AEA5',
                          textTransform: 'capitalize',
                        }}
                      >
                        · {entry.persona}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontFamily: 'sans-serif',
                      color: '#8A8780',
                    }}
                  >
                    {entry.date}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: '17px',
                    fontFamily: 'serif',
                    lineHeight: 1.3,
                    color: '#FAF9F5',
                    overflow: 'hidden',
                  }}
                >
                  {entry.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
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
  latestEntry: { title: string; date: string; content: string } | null;
  entryCount: number;
}) {
  const desc =
    description ||
    'What I’m reading, exploring, working on, and thinking about these days.';

  // Extract snippet from latest entry content
  const contentSnippet = latestEntry
    ? latestEntry.content
        .split('\n')
        .map((l) => l.trim())
        .filter(
          (l) =>
            l &&
            !l.startsWith('#') &&
            !l.startsWith('```') &&
            !l.startsWith('![') &&
            !l.startsWith('>') &&
            !l.startsWith('<'),
        )
        .slice(0, 2)
        .join(' ')
        .slice(0, 130)
    : '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'row',
          background: '#141413',
          color: '#FAF9F5',
          fontFamily: 'serif',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background:
              'linear-gradient(90deg, #D97757 0%, #04A4BA 50%, #788C5D 100%)',
          }}
        />

        {/* Left text column */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: '0 0 52%',
            padding: '52px 64px 48px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Top live pulse label */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#04A4BA',
              }}
            />
            <span
              style={{
                fontSize: '14px',
                fontFamily: 'sans-serif',
                color: '#04A4BA',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                fontWeight: 600,
              }}
            >
              Now
            </span>
            <span style={{ fontSize: '12px', color: '#555550' }}>✦</span>
            <span
              style={{
                fontSize: '14px',
                fontFamily: 'sans-serif',
                color: '#B0AEA5',
                letterSpacing: '0.05em',
              }}
            >
              {latestEntry ? `Updated ${latestEntry.title}` : 'Live Timeline'}
            </span>
          </div>

          {/* Title and description */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div
              style={{
                fontSize: '64px',
                fontWeight: 400,
                lineHeight: 1.05,
                letterSpacing: '-0.025em',
                color: '#FAF9F5',
              }}
            >
              {title || 'Now'}
            </div>

            <div
              style={{
                fontSize: '20px',
                fontFamily: 'sans-serif',
                color: '#B0AEA5',
                lineHeight: 1.45,
                maxWidth: '460px',
              }}
            >
              {desc}
            </div>
          </div>

          {/* Bottom branding */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '17px',
                fontFamily: 'sans-serif',
                fontWeight: 600,
                color: '#FAF9F5',
                letterSpacing: '0.02em',
              }}
            >
              {SITE_DOMAIN}
            </span>
          </div>
        </div>

        {/* Right column — dynamic timeline & telemetry card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: '0 0 48%',
            position: 'relative',
            paddingRight: '56px',
          }}
        >
          {/* Subtle teal/blue background glow */}
          <div
            style={{
              position: 'absolute',
              width: '440px',
              height: '440px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(4,164,186,0.12) 0%, rgba(217,119,87,0.04) 50%, transparent 70%)',
            }}
          />

          {/* Timeline visualization */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              width: '100%',
              maxWidth: '440px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Active latest entry card */}
            {latestEntry && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  background: '#1c1c1a',
                  border: '1px solid rgba(4,164,186,0.3)',
                  borderRadius: '16px',
                  padding: '24px 26px',
                  boxShadow: '0 16px 36px rgba(0,0,0,0.5)',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      fontFamily: 'sans-serif',
                      color: '#04A4BA',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    ✦ Current Update
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontFamily: 'sans-serif',
                      color: '#B0AEA5',
                    }}
                  >
                    {latestEntry.title}
                  </span>
                </div>

                {contentSnippet && (
                  <div
                    style={{
                      fontSize: '15px',
                      fontFamily: 'sans-serif',
                      color: '#FAF9F5',
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
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                paddingLeft: '12px',
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#04A4BA',
                }}
              />
              <div
                style={{
                  height: '2px',
                  width: '60px',
                  background: 'rgba(250,249,245,0.15)',
                }}
              />
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'rgba(250,249,245,0.2)',
                }}
              />
              <div
                style={{
                  height: '2px',
                  width: '40px',
                  background: 'rgba(250,249,245,0.1)',
                }}
              />
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'rgba(250,249,245,0.15)',
                }}
              />
              <span
                style={{
                  fontSize: '12px',
                  fontFamily: 'sans-serif',
                  color: '#8A8780',
                  marginLeft: '8px',
                }}
              >
                {entryCount} updates recorded
              </span>
            </div>
          </div>

          {/* Faint watermark typography in background */}
          <div
            style={{
              position: 'absolute',
              right: '24px',
              bottom: '24px',
              fontSize: '140px',
              fontWeight: 400,
              lineHeight: 1,
              color: 'rgba(250,249,245,0.025)',
              fontFamily: 'serif',
              letterSpacing: '-0.05em',
              userSelect: 'none',
            }}
          >
            now
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

// ── Cover image resolution (SSRF-protected + local file fallback) ───────────

const ALLOWED_IMAGE_HOSTS = new Set([
  'upload.wikimedia.org',
  'images.unsplash.com',
  'lh3.googleusercontent.com',
  'images.pexels.com',
]);

function isAllowedCoverHost(hostname: string): boolean {
  if (ALLOWED_IMAGE_HOSTS.has(hostname)) return true;
  if (hostname.endsWith('.supabase.co')) return true;
  try {
    const siteHost = new URL(SITE_URL).hostname;
    if (hostname === siteHost) return true;
    if (
      process.env.NODE_ENV === 'development' &&
      (hostname === 'localhost' || hostname === '127.0.0.1')
    ) {
      return true;
    }
  } catch {
    // Ignore URL parse error
  }
  return false;
}

async function resolveCoverImage(
  coverImage: string | undefined,
): Promise<string | null> {
  if (!coverImage || typeof coverImage !== 'string') return null;
  const trimmed = coverImage.trim();
  if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/\\')) return null;

  // 1. Try resolving local files directly from public directory
  if (trimmed.startsWith('/')) {
    try {
      const cleanPath = trimmed.replace(/^\/+/, '');
      const localFilePath = path.join(process.cwd(), 'public', cleanPath);
      if (fs.existsSync(localFilePath)) {
        const ext = path.extname(localFilePath).toLowerCase();
        const mime =
          ext === '.png'
            ? 'image/png'
            : ext === '.webp'
              ? 'image/webp'
              : ext === '.svg'
                ? 'image/svg+xml'
                : 'image/jpeg';
        const buffer = await fs.promises.readFile(localFilePath);
        if (buffer.byteLength <= 5 * 1024 * 1024) {
          return `data:${mime};base64,${buffer.toString('base64')}`;
        }
      }
    } catch {
      // fallback to remote fetch
    }
  }

  // 2. Remote URL fetch
  try {
    let targetUrl: string;

    if (trimmed.startsWith('/')) {
      targetUrl = `${SITE_URL}${trimmed}`;
    } else {
      const parsed = new URL(trimmed);
      if (
        parsed.protocol !== 'https:' &&
        (process.env.NODE_ENV !== 'development' || parsed.protocol !== 'http:')
      ) {
        return null;
      }
      if (!isAllowedCoverHost(parsed.hostname)) {
        return null;
      }
      targetUrl = trimmed;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(targetUrl, {
      signal: controller.signal,
      next: { revalidate: 86400 },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.startsWith('image/')) {
        return null;
      }
      const buf = await res.arrayBuffer();
      if (buf.byteLength > 5 * 1024 * 1024) {
        return null;
      }
      return `data:${contentType};base64,${Buffer.from(buf).toString('base64')}`;
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
  const displayTitle = title.length > 80 ? title.slice(0, 77) + '…' : title;
  const displayDescription =
    description.length > 120 ? description.slice(0, 117) + '…' : description;

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'row',
          background: '#141413',
          color: '#FAF9F5',
          fontFamily: 'serif',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background:
              'linear-gradient(90deg, #D97757 0%, #04A4BA 50%, #788C5D 100%)',
          }}
        />

        {/* Left text column */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: hasCover ? '0 0 60%' : '1 1 100%',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Top bar: Type + Persona */}
          {(typeLabel || personaLabel) && (
            <div
              style={{
                padding: '48px 72px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span
                style={{
                  fontSize: '15px',
                  fontFamily: 'sans-serif',
                  color: '#D97757',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  fontWeight: 600,
                }}
              >
                {typeLabel}
              </span>
              {typeLabel && personaLabel && (
                <span
                  style={{
                    fontSize: '12px',
                    color: '#4a4a45',
                  }}
                >
                  ✦
                </span>
              )}
              {personaLabel && (
                <span
                  style={{
                    fontSize: '15px',
                    fontFamily: 'sans-serif',
                    color: '#D97757',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
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
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              justifyContent: 'center',
              padding: '0 72px',
            }}
          >
            {/* Title */}
            <div
              style={{
                fontSize: isHome ? '80px' : '64px',
                fontWeight: 400,
                lineHeight: 1.05,
                letterSpacing: '-0.025em',
                maxWidth: hasCover ? '580px' : '900px',
              }}
            >
              {displayTitle}
            </div>

            {/* Description */}
            {displayDescription && (
              <div
                style={{
                  fontSize: '21px',
                  fontFamily: 'sans-serif',
                  color: '#B0AEA5',
                  marginTop: '24px',
                  maxWidth: hasCover ? '480px' : '800px',
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
              display: 'flex',
              alignItems: 'center',
              padding: '0 72px 48px',
            }}
          >
            <div
              style={{
                fontSize: '18px',
                fontFamily: 'sans-serif',
                fontWeight: 600,
                color: '#FAF9F5',
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: '0 0 38%',
              padding: '56px 64px 56px 0',
              position: 'relative',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImageB64}
              alt=""
              style={{
                maxWidth: '85%',
                maxHeight: '80%',
                objectFit: 'contain',
                position: 'relative',
                zIndex: 1,
              }}
            />
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}

function generateFallbackOG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 72px',
          background: '#141413',
          color: '#FAF9F5',
          fontFamily: 'serif',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background:
              'linear-gradient(90deg, #D97757 0%, #04A4BA 50%, #788C5D 100%)',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: '80px',
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
            }}
          >
            {SITE_NAME}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: '18px',
              fontFamily: 'sans-serif',
              fontWeight: 600,
              color: '#FAF9F5',
            }}
          >
            {SITE_DOMAIN}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
