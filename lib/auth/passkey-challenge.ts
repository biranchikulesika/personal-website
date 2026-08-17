import { LRUCache } from 'lru-cache';

interface ChallengeRecord {
  challenge: string;
  userId: string;
  expiresAt: number;
}

// In-Memory Secure Challenge Store
// Challenges expire automatically after 5 minutes (300,000 ms)
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

const registrationChallengeCache = new LRUCache<string, ChallengeRecord>({
  max: 10000,
  ttl: CHALLENGE_TTL_MS,
});

/**
 * Stores a cryptographically generated WebAuthn registration challenge for an authenticated user.
 * Overwrites any previously pending challenge for this user.
 */
export function saveRegistrationChallenge(userId: string, challenge: string): void {
  const expiresAt = Date.now() + CHALLENGE_TTL_MS;
  registrationChallengeCache.set(userId, {
    challenge,
    userId,
    expiresAt,
  });
}

/**
 * Retrieves and atomically consumes (removes) the stored registration challenge for a user.
 * Single-use enforcement: Once retrieved, the challenge is removed immediately to prevent replay attacks.
 *
 * @returns The stored challenge string, or null if expired/non-existent.
 */
export function consumeRegistrationChallenge(userId: string): string | null {
  const record = registrationChallengeCache.get(userId);
  if (!record) {
    return null;
  }

  // Atomically delete to guarantee single-use
  registrationChallengeCache.delete(userId);

  if (Date.now() > record.expiresAt) {
    return null;
  }

  return record.challenge;
}
