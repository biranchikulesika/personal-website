'use server';

import { headers } from 'next/headers';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  type RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { verifyAuth } from '@/lib/auth/verify';
import { getWebAuthnConfig } from '@/lib/auth/passkey.config';
import {
  saveRegistrationChallenge,
  consumeRegistrationChallenge,
} from '@/lib/auth/passkey-challenge';
import { PasskeyService } from '@/lib/services/passkey.service';
import { PasskeyListItem } from '@/lib/types/passkey';

const passkeyService = new PasskeyService();

/**
 * Structured security audit logging (no sensitive secrets or keys logged).
 */
function logSecurityEvent(event: string, meta: Record<string, any>) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      service: 'webauthn',
      event,
      ...meta,
    })
  );
}

/**
 * Starts passkey registration ceremony by creating cryptographic options and challenge.
 * Requires an active authenticated session.
 */
export async function generatePasskeyRegistrationOptionsAction() {
  const { user } = await verifyAuth();

  const headersList = await headers();
  const config = getWebAuthnConfig(headersList);

  const existingCredentials = await passkeyService.getPasskeysForExclusion(user.id);

  // Derive display names safely
  const userName = user.email || 'Admin';
  const userDisplayName = user.user_metadata?.full_name || user.email || 'Admin';

  const options = await generateRegistrationOptions({
    rpName: config.rpName,
    rpID: config.rpID,
    userID: Buffer.from(user.id, 'utf-8'),
    userName,
    userDisplayName,
    attestationType: 'none',
    excludeCredentials: existingCredentials.map(cred => ({
      id: cred.id,
      transports: cred.transports,
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
      authenticatorAttachment: 'cross-platform', // allows platform biometrics, security keys, or phone sync
    },
  });

  // Store challenge against authenticated user with strict single-use TTL
  saveRegistrationChallenge(user.id, options.challenge);

  logSecurityEvent('passkey_registration_started', {
    userId: user.id,
    rpID: config.rpID,
  });

  return {
    success: true,
    options,
  };
}

/**
 * Verifies the WebAuthn registration response returned by the authenticator/browser.
 * Cryptographically checks the signature, origin, challenge, and RP ID.
 */
export async function verifyPasskeyRegistrationAction(
  responseJSON: RegistrationResponseJSON,
  customName?: string
) {
  const { user } = await verifyAuth();

  // Retrieve and atomically consume challenge (single-use enforcement)
  const expectedChallenge = consumeRegistrationChallenge(user.id);
  if (!expectedChallenge) {
    logSecurityEvent('passkey_registration_failed', {
      userId: user.id,
      reason: 'challenge_expired_or_missing',
    });
    throw new Error('Registration session expired or invalid. Please try again.');
  }

  const headersList = await headers();
  const config = getWebAuthnConfig(headersList);

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: responseJSON,
      expectedChallenge,
      expectedOrigin: config.expectedOrigins,
      expectedRPID: config.rpID,
      requireUserVerification: false,
    });
  } catch (error: any) {
    logSecurityEvent('passkey_registration_failed', {
      userId: user.id,
      error: error.message,
    });
    throw new Error('Cryptographic verification failed: ' + (error.message || 'Invalid response'));
  }

  const { verified, registrationInfo } = verification;

  if (!verified || !registrationInfo) {
    logSecurityEvent('passkey_registration_failed', {
      userId: user.id,
      reason: 'verification_returned_false',
    });
    throw new Error('Passkey registration could not be verified.');
  }

  const { credential, credentialDeviceType, credentialBackedUp, aaguid } = registrationInfo;

  // Prevent duplicate credential registration
  const isDuplicate = await passkeyService.isCredentialRegistered(credential.id);
  if (isDuplicate) {
    logSecurityEvent('passkey_registration_failed', {
      userId: user.id,
      credentialId: credential.id,
      reason: 'duplicate_credential',
    });
    throw new Error('This passkey credential is already registered.');
  }

  // Transports from response or authenticator
  const transports = (responseJSON.response?.transports || credential.transports || []) as any;

  // Determine a default friendly name if none provided
  const passkeyName = customName?.trim() || (credentialDeviceType === 'multiDevice' ? 'Synced Passkey' : 'Security Key');

  // Persist credential
  const savedCredential = await passkeyService.savePasskey({
    userId: user.id,
    credentialId: credential.id,
    publicKey: Buffer.from(credential.publicKey).toString('base64url'),
    counter: credential.counter,
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
    transports,
    name: passkeyName,
    aaguid: aaguid || null,
    lastUsedAt: null,
  });

  logSecurityEvent('passkey_registration_success', {
    userId: user.id,
    credentialId: credential.id,
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
  });

  return {
    success: true,
    credential: {
      id: savedCredential.id,
      credentialId: savedCredential.credentialId,
      name: savedCredential.name,
      deviceType: savedCredential.deviceType,
      backedUp: savedCredential.backedUp,
      transports: savedCredential.transports,
      createdAt: savedCredential.createdAt,
      lastUsedAt: savedCredential.lastUsedAt,
    } as PasskeyListItem,
  };
}

/**
 * Lists all passkey credentials registered for the current authenticated user.
 */
export async function listPasskeysAction(): Promise<PasskeyListItem[]> {
  const { user } = await verifyAuth();
  return await passkeyService.getUserPasskeys(user.id);
}

/**
 * Renames a passkey owned by the authenticated user.
 */
export async function renamePasskeyAction(id: string, name: string) {
  const { user } = await verifyAuth();
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Passkey name cannot be empty.');
  if (trimmed.length > 50) throw new Error('Passkey name is too long (max 50 characters).');

  await passkeyService.renamePasskey(id, user.id, trimmed);
  return { success: true };
}

/**
 * Deletes a passkey owned by the authenticated user.
 */
export async function deletePasskeyAction(id: string) {
  const { user } = await verifyAuth();
  await passkeyService.deletePasskey(id, user.id);

  logSecurityEvent('passkey_deletion_success', {
    userId: user.id,
    passkeyId: id,
  });

  return { success: true };
}
