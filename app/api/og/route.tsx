import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

/**
 * Dynamic OG image generation.
 *
 * Generates a 1200×630 image matching the site's dark editorial theme.
 * Accepts optional search params for dynamic content:
 *   - title: Page/post title
 *   - description: Page description
 *   - type: 'home' | 'post' | 'note' | 'page'
 *
 * Falls back to the default site branding when no params are provided.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get('title') || 'Biranchi Kulesika';
  const description = searchParams.get('description') || '';
  const type = searchParams.get('type') || 'home';

  // Truncate title for display
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
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          background: '#141413',
          color: '#FAF9F5',
          fontFamily: 'serif',
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
            background: 'linear-gradient(90deg, #D97757 0%, #04A4BA 50%, #788C5D 100%)',
          }}
        />

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
          {type !== 'home' && (
            <div
              style={{
                fontSize: '18px',
                fontFamily: 'sans-serif',
                color: '#D97757',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                marginBottom: '24px',
              }}
            >
              {type === 'post' ? 'Essay' : type === 'note' ? 'Note' : 'Biranchi Kulesika'}
            </div>
          )}

          <div
            style={{
              fontSize: type === 'home' ? '72px' : '56px',
              fontWeight: 400,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              maxWidth: '900px',
            }}
          >
            {displayTitle}
          </div>

          {displayDescription && (
            <div
              style={{
                fontSize: '24px',
                fontFamily: 'sans-serif',
                color: '#B0AEA5',
                marginTop: '24px',
                maxWidth: '800px',
                lineHeight: 1.4,
              }}
            >
              {displayDescription}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: '20px',
              fontFamily: 'sans-serif',
              fontWeight: 600,
              color: '#FAF9F5',
            }}
          >
            biranchikulesika.com
          </div>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#D97757',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontFamily: 'sans-serif',
              fontWeight: 700,
              color: '#141413',
            }}
          >
            BK
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
