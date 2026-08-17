/**
 * WebAuthn (Passkeys) Relying Party (RP) configuration.
 *
 * Implements standard RP identification and origin resolution
 * according to W3C WebAuthn Level 3 specifications.
 */

export interface WebAuthnConfig {
  rpName: string;
  rpID: string;
  expectedOrigins: string[];
}

/**
 * Resolves the appropriate WebAuthn configuration based on the environment
 * and optional incoming request headers.
 */
export function getWebAuthnConfig(reqHeaders?: Headers | Record<string, string | null | undefined>): WebAuthnConfig {
  const isDev = process.env.NODE_ENV === 'development';

  // 1. RP Name
  const rpName = process.env.WEBAUTHN_RP_NAME || process.env.NEXT_PUBLIC_WEBAUTHN_RP_NAME || 'Biranchi CMS';

  // 2. Derive host / domain from headers if available
  let headerHost: string | null = null;
  let headerOrigin: string | null = null;

  if (reqHeaders) {
    if ('get' in reqHeaders && typeof reqHeaders.get === 'function') {
      headerHost = reqHeaders.get('host') || reqHeaders.get('x-forwarded-host');
      headerOrigin = reqHeaders.get('origin');
    } else {
      const h = reqHeaders as Record<string, string | null | undefined>;
      headerHost = h['host'] || h['x-forwarded-host'] || null;
      headerOrigin = h['origin'] || null;
    }
  }

  // Remove port from host if present
  const rawHostname = headerHost ? headerHost.split(':')[0] : null;

  // 3. Determine RP ID (must be a valid domain string, never a full URL or IP unless permitted)
  let rpID = process.env.WEBAUTHN_RP_ID || process.env.NEXT_PUBLIC_WEBAUTHN_RP_ID;

  if (!rpID) {
    if (isDev) {
      rpID = 'localhost';
    } else if (rawHostname && (rawHostname.endsWith('biranchikulesika.com') || rawHostname === 'biranchikulesika.com')) {
      rpID = 'biranchikulesika.com';
    } else if (rawHostname && rawHostname !== 'localhost') {
      rpID = rawHostname;
    } else {
      rpID = 'biranchikulesika.com';
    }
  }

  // 4. Determine Expected Origins
  const configuredOrigin = process.env.WEBAUTHN_ORIGIN || process.env.NEXT_PUBLIC_WEBAUTHN_ORIGIN;
  const expectedOriginsSet = new Set<string>();

  if (configuredOrigin) {
    configuredOrigin.split(',').forEach(o => {
      const trimmed = o.trim();
      if (trimmed) expectedOriginsSet.add(trimmed);
    });
  }

  if (isDev) {
    expectedOriginsSet.add('http://localhost:3000');
    expectedOriginsSet.add('http://localhost:3001');
    expectedOriginsSet.add('http://127.0.0.1:3000');
    expectedOriginsSet.add('http://127.0.0.1:3001');
  }

  // Production base domains
  expectedOriginsSet.add('https://biranchikulesika.com');
  expectedOriginsSet.add('https://www.biranchikulesika.com');
  expectedOriginsSet.add('https://builder.biranchikulesika.com');
  expectedOriginsSet.add('https://operator.biranchikulesika.com');
  expectedOriginsSet.add('https://thinker.biranchikulesika.com');
  expectedOriginsSet.add('https://wanderer.biranchikulesika.com');

  if (headerOrigin) {
    // If incoming origin belongs to the same domain hierarchy, include it for strict matching
    try {
      const parsed = new URL(headerOrigin);
      if (parsed.hostname === rpID || parsed.hostname.endsWith(`.${rpID}`) || (isDev && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'))) {
        expectedOriginsSet.add(headerOrigin);
      }
    } catch {
      // Ignore malformed origin
    }
  }

  return {
    rpName,
    rpID,
    expectedOrigins: Array.from(expectedOriginsSet),
  };
}
