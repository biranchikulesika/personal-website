import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { getSiteDomain, getSiteUrl, getSupabaseJwtSecret, getSupabaseSecretKey } from '@/lib/config/env';

export interface PasskeyChallengePayload {
  challenge: string;
  userId?: string;
  action: 'registration' | 'authentication';
  expiresAt: number;
}

const CHALLENGE_COOKIE_NAME = '__passkey_challenge';
const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function getWebAuthnRpID(hostname?: string): string {
  if (hostname) {
    const cleaned = hostname.split(':')[0].trim().toLowerCase();
    if (cleaned === 'localhost' || cleaned === '127.0.0.1') {
      return 'localhost';
    }
    const siteDomain = getSiteDomain().toLowerCase();
    if (cleaned === siteDomain || cleaned.endsWith(`.${siteDomain}`)) {
      return siteDomain;
    }
    return cleaned;
  }
  return getSiteDomain() || 'localhost';
}

export function getWebAuthnExpectedOrigin(reqOrigin?: string): string | string[] {
  const canonicalUrl = getSiteUrl().replace(/\/+$/, '');
  const allowedOrigins = new Set<string>([canonicalUrl]);

  try {
    const parsed = new URL(canonicalUrl);
    allowedOrigins.add(`https://${parsed.hostname}`);
    if (!parsed.hostname.startsWith('www.') && !parsed.hostname.includes('localhost')) {
      allowedOrigins.add(`https://www.${parsed.hostname}`);
    }
  } catch {
    // Ignore URL parse error
  }

  if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.add('http://localhost:3000');
    allowedOrigins.add('http://127.0.0.1:3000');
  }

  if (reqOrigin) {
    const cleanOrigin = reqOrigin.replace(/\/+$/, '');
    if (allowedOrigins.has(cleanOrigin)) {
      return cleanOrigin;
    }
  }

  return Array.from(allowedOrigins);
}

export function getWebAuthnRpName(): string {
  return 'Biranchi Kulesika';
}

function getChallengeSigningSecret(): string {
  return (
    getSupabaseJwtSecret() ||
    getSupabaseSecretKey() ||
    process.env.ADMIN_PASSWORD_HASH ||
    'webauthn-server-challenge-secret-key-32b'
  );
}

export function signChallengePayload(payload: PasskeyChallengePayload): string {
  const secret = getChallengeSigningSecret();
  const encodedData = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(encodedData)
    .digest('base64url');
  return `${encodedData}.${signature}`;
}

export function verifyChallengeToken(token: string): PasskeyChallengePayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encodedData, signature] = parts;
    const secret = getChallengeSigningSecret();
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(encodedData)
      .digest('base64url');

    if (
      signature.length !== expectedSig.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(encodedData, 'base64url').toString('utf-8')
    ) as PasskeyChallengePayload;

    if (!payload.challenge || !payload.expiresAt || !payload.action) {
      return null;
    }

    if (Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function setPasskeyChallengeCookie(payload: {
  challenge: string;
  userId?: string;
  action: 'registration' | 'authentication';
}) {
  const expiresAt = Date.now() + CHALLENGE_TTL_MS;
  const token = signChallengePayload({
    challenge: payload.challenge,
    userId: payload.userId,
    action: payload.action,
    expiresAt,
  });

  try {
    const cookieStore = await cookies();
    cookieStore.set(CHALLENGE_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 300, // 5 minutes
    });
  } catch {
    // Cookie store may throw if outside Next.js request context (e.g. unit tests)
  }
}

export async function consumePasskeyChallengeCookie(
  expectedAction: 'registration' | 'authentication'
): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(CHALLENGE_COOKIE_NAME);
    if (!cookie?.value) return null;

    // Immediately consume and invalidate the cookie to prevent replay attacks
    cookieStore.set(CHALLENGE_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    const payload = verifyChallengeToken(cookie.value);
    if (!payload || payload.action !== expectedAction) {
      return null;
    }

    return payload.challenge;
  } catch {
    return null;
  }
}
