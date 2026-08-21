import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { ContentService } from '@/lib/services/content.service';
import { SITE_URL, SITE_NAME, SITE_DOMAIN, PERSONA_LABELS } from '@/lib/constants';

/**
 * Dynamic OG image generation.
 *
 * Two modes:
 *   1. With ?slug=<post-slug>: Resolves the post via the service layer,
 *      fetches its cover artwork, and generates a composed 1200×630 image
 *      with text on the left and cover artwork on the right.
 *   2. Without slug: Generates a default OG image for the home page or
 *      other non-post pages using query params (title, description, type).
 *
 * The cover image is NEVER used directly as the OG image.
 * It is one element inside the generated composition.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const slug = searchParams.get('slug');

  // ── Per-post mode: resolve post from database ────────────────────────────
  if (slug) {
    const service = new ContentService();
    const post = await service.getPost(slug);

    if (!post) {
      return generateFallbackOG();
    }

    const personaLabel = post.persona ? PERSONA_LABELS[post.persona] : '';
    const coverImageB64 = await resolveCoverImage(post.coverImage);

    return generatePostOG({
      title: post.title,
      description: post.description || post.subtitle || '',
      typeLabel: 'Essay',
      personaLabel,
      coverImageB64,
      hasCover: Boolean(coverImageB64),
    });
  }

  // ── Generic mode: use query params directly ──────────────────────────────
  const title = searchParams.get('title') || SITE_NAME;
  const description = searchParams.get('description') || '';
  const type = searchParams.get('type') || 'home';
  const persona = searchParams.get('persona') || '';
  const coverUrl = searchParams.get('cover') || '';

  const typeLabel =
    type === 'post' ? 'Essay' : type === 'note' ? 'Note' : '';

  const coverImageB64 = coverUrl ? await resolveCoverImage(coverUrl) : null;

  return generatePostOG({
    title,
    description,
    typeLabel,
    personaLabel: persona,
    coverImageB64,
    hasCover: Boolean(coverImageB64),
    isHome: type === 'home',
  });
}

// ── Cover image resolution (SSRF-protected) ──────────────────────────────────

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
    if (process.env.NODE_ENV === 'development' && (hostname === 'localhost' || hostname === '127.0.0.1')) {
      return true;
    }
  } catch {
    // Ignore URL parse error
  }
  return false;
}

/**
 * Fetch a cover image and convert to base64 data URL for server-side rendering.
 * Protected against SSRF: only fetches from trusted image CDNs or relative site paths.
 */
async function resolveCoverImage(
  coverImage: string | undefined,
): Promise<string | null> {
  if (!coverImage || typeof coverImage !== 'string') return null;
  const trimmed = coverImage.trim();
  if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/\\')) return null;

  try {
    let targetUrl: string;

    if (trimmed.startsWith('/')) {
      targetUrl = `${SITE_URL}${trimmed}`;
    } else {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'https:' && (process.env.NODE_ENV !== 'development' || parsed.protocol !== 'http:')) {
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
      // Enforce 5MB limit
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

// ── OG image generation ─────────────────────────────────────────────────────

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
            {/* Title — larger */}
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

          {/* Bottom bar: site name + logo */}
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
