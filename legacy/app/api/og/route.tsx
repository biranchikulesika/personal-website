import { ImageResponse } from 'next/og';
import { SITE_NAME, AUTHOR } from '@/lib/config/seo';

export const runtime = 'edge';

/**
 * Font files loaded as ArrayBuffers for use in Satori-rendered OG images.
 * Fetched from Google Fonts at build/request time and cached via the Edge Runtime.
 */

async function loadGoogleFont(fontFamily: string, weight: number = 400): Promise<ArrayBuffer> {
  const apiUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@${weight}&display=swap`;
  const css = await fetch(apiUrl).then((res) => res.text());

  // Extract the woff2 URL from the CSS @font-face declaration
  const fontUrlMatch = css.match(/src: url\((.+?)\)/);
  if (!fontUrlMatch) {
    throw new Error(`Could not load font: ${fontFamily}`);
  }

  return fetch(fontUrlMatch[1]).then((res) => res.arrayBuffer());
}

// Persona color configuration for OG images
const PERSONA_COLORS: Record<string, { accent: string; text: string; badge: string }> = {
  builder: { accent: '#D97706', text: '#F5F5F2', badge: '#D97706' },
  operator: { accent: '#5F7A69', text: '#F5F5F2', badge: '#5F7A69' },
  thinker: { accent: '#7E7A73', text: '#DEDAD3', badge: '#7E7A73' },
  wanderer: { accent: '#B67A55', text: '#DDD2C5', badge: '#B67A55' },
};

const DEFAULT_COLOR = { accent: '#57534E', text: '#F5F5F2', badge: '#57534E' };

const PERSONA_LABELS: Record<string, string> = {
  builder: 'Forge Workspace',
  operator: 'Operator Workspace',
  thinker: 'Inside The Head',
  wanderer: 'Scribble Explorer',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const title = searchParams.get('title') || 'Untitled';
  const persona = searchParams.get('persona') || 'main';
  const excerpt = searchParams.get('excerpt') || '';

  const colors = PERSONA_COLORS[persona] || DEFAULT_COLOR;
  const personaLabel = PERSONA_LABELS[persona] || '';

  const maxTitleLength = 80;
  const truncatedTitle = title.length > maxTitleLength
    ? title.slice(0, maxTitleLength).trim() + '…'
    : title;

  const maxExcerptLength = 120;
  const truncatedExcerpt = excerpt.length > maxExcerptLength
    ? excerpt.slice(0, maxExcerptLength).trim() + '…'
    : excerpt;

  const hasExcerpt = truncatedExcerpt.length > 0;

  // Load fonts in parallel
  const [cormorantSemiBold, interRegular] = await Promise.all([
    loadGoogleFont('Cormorant+Garamond', 600),
    loadGoogleFont('Inter', 400),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#050505',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle grid overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Subtle radial glow */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: '60%',
            height: '80%',
            background: `radial-gradient(ellipse at center, ${colors.accent}15, transparent 70%)`,
          }}
        />

        {/* Left accent bar */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 8,
            background: colors.accent,
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '56px 64px 48px 72px',
            width: '100%',
            height: '100%',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Top section: Persona badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '6px 16px',
                borderRadius: 999,
                background: `${colors.accent}20`,
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: `${colors.accent}30`,
              }}
            >
              {/* Brand amber dot */}
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#D97706',
                }}
              />
              <span
                style={{
                  fontFamily: '"Inter"',
                  fontSize: 14,
                  fontWeight: 400,
                  color: `${colors.accent}`,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                }}
              >
                {personaLabel ? `${personaLabel.toUpperCase()}` : 'BIRANCHI KULESIKA'}
              </span>
            </div>
          </div>

          {/* Center section: Title and excerpt */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: hasExcerpt ? 20 : 0,
              maxWidth: '90%',
            }}
          >
            <h1
              style={{
                fontFamily: '"Cormorant Garamond"',
                fontSize: 56,
                fontWeight: 600,
                color: colors.text,
                lineHeight: 1.1,
                letterSpacing: -1,
                margin: 0,
                padding: 0,
              }}
            >
              {truncatedTitle}
            </h1>
            {hasExcerpt && (
              <p
                style={{
                  fontFamily: '"Inter"',
                  fontSize: 20,
                  fontWeight: 400,
                  color: `${colors.text}`,
                  opacity: 0.65,
                  lineHeight: 1.5,
                  margin: 0,
                  padding: 0,
                  maxWidth: '85%',
                }}
              >
                {truncatedExcerpt}
              </p>
            )}
          </div>

          {/* Bottom section: Author and site */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: `1px solid rgba(255,255,255,0.08)`,
              paddingTop: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#1A1A1A',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: '"Inter"',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#D97706',
                    letterSpacing: 1,
                  }}
                >
                  B
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span
                  style={{
                    fontFamily: '"Inter"',
                    fontSize: 15,
                    fontWeight: 400,
                    color: '#F5F5F2',
                    letterSpacing: 0.5,
                  }}
                >
                  {AUTHOR.name}
                </span>
                <span
                  style={{
                    fontFamily: '"Inter"',
                    fontSize: 11,
                    fontWeight: 400,
                    color: 'rgba(255,255,255,0.4)',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                  }}
                >
                  {SITE_NAME}
                </span>
              </div>
            </div>

            {/* Site branding */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                opacity: 0.3,
              }}
            >
              <span
                style={{
                  fontFamily: '"Inter"',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#F5F5F2',
                  letterSpacing: 2,
                }}
              >
                BIRANCHI
              </span>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#D97706',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Cormorant Garamond',
          data: cormorantSemiBold,
          weight: 600,
          style: 'normal',
        },
        {
          name: 'Inter',
          data: interRegular,
          weight: 400,
          style: 'normal',
        },
      ],
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
  );
}
