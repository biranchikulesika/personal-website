import assert from 'node:assert/strict';
import { test } from 'node:test';
import crypto from 'node:crypto';
import {
  signChallengePayload,
  verifyChallengeToken,
  getWebAuthnRpID,
  getWebAuthnExpectedOrigin,
  getWebAuthnRpName,
} from '../lib/auth/webauthn';
import {
  generatePasskeyAuthenticationOptionsAction,
  verifyPasskeyLoginAction,
  signInWithPasskey,
} from '../app/admin/login/actions';
import {
  startPasskeyRegistrationAction,
  verifyPasskeyRegistrationAction,
  registerPasskeyAction,
} from '../app/admin/actions';
import { setContentRepositoryForTesting } from '../lib/repositories';
import { InMemoryTestContentRepository } from './in-memory-test-content-repository';

// ── WebAuthn Configuration & Helper Tests ──────────────────────────────────

test('getWebAuthnRpID properly resolves hostnames', () => {
  assert.equal(getWebAuthnRpID('localhost:3000'), 'localhost');
  assert.equal(getWebAuthnRpID('127.0.0.1:3000'), 'localhost');
  assert.equal(getWebAuthnRpID('biranchikulesika.com'), 'biranchikulesika.com');
  assert.equal(getWebAuthnRpID('admin.biranchikulesika.com'), 'biranchikulesika.com');
});

test('getWebAuthnExpectedOrigin includes canonical and development origins', () => {
  const origins = getWebAuthnExpectedOrigin();
  assert.ok(Array.isArray(origins));
  assert.ok(origins.some((o) => o.includes('http://localhost:3000')));

  const matched = getWebAuthnExpectedOrigin('http://localhost:3000');
  assert.equal(matched, 'http://localhost:3000');
});

test('getWebAuthnRpName returns correct relying party name', () => {
  assert.equal(getWebAuthnRpName(), 'Biranchi Kulesika');
});

// ── Challenge Signing and Replay Protection Tests ──────────────────────────

test('signChallengePayload and verifyChallengeToken handle valid challenge payloads', () => {
  const payload = {
    challenge: 'cryptographic_random_challenge_123',
    userId: 'user-admin-456',
    action: 'authentication' as const,
    expiresAt: Date.now() + 60000,
  };

  const token = signChallengePayload(payload);
  assert.ok(typeof token === 'string');
  assert.ok(token.includes('.'));

  const verified = verifyChallengeToken(token);
  assert.ok(verified);
  assert.equal(verified?.challenge, payload.challenge);
  assert.equal(verified?.userId, payload.userId);
  assert.equal(verified?.action, payload.action);
});

test('verifyChallengeToken rejects expired challenge tokens', () => {
  const payload = {
    challenge: 'expired_challenge_123',
    action: 'authentication' as const,
    expiresAt: Date.now() - 1000, // Expired 1 second ago
  };

  const token = signChallengePayload(payload);
  const verified = verifyChallengeToken(token);
  assert.equal(verified, null, 'Expired challenge token must be rejected');
});

test('verifyChallengeToken rejects tampered challenge tokens', () => {
  const payload = {
    challenge: 'tamper_test_123',
    action: 'authentication' as const,
    expiresAt: Date.now() + 60000,
  };

  const token = signChallengePayload(payload);
  const [data, sig] = token.split('.');

  // Tamper data payload
  const tamperedData = Buffer.from(
    JSON.stringify({ ...payload, challenge: 'tampered_challenge' })
  ).toString('base64url');
  const tamperedToken = `${tamperedData}.${sig}`;

  assert.equal(
    verifyChallengeToken(tamperedToken),
    null,
    'Tampered payload must fail signature check'
  );

  // Tamper signature
  const badSigToken = `${data}.${sig.slice(0, -2)}xx`;
  assert.equal(
    verifyChallengeToken(badSigToken),
    null,
    'Tampered signature must fail signature check'
  );
});

// ── Authentication Options & Verification Boundary Tests ───────────────────

test('generatePasskeyAuthenticationOptionsAction generates valid options with challenge', async () => {
  const res = await generatePasskeyAuthenticationOptionsAction();
  assert.equal(res.success, true);
  assert.ok(res.options);
  assert.ok(res.options.challenge);
  assert.ok(typeof res.options.challenge === 'string');
  assert.equal(res.options.rpId, 'biranchikulesika.com');
});

test('verifyPasskeyLoginAction rejects when no challenge cookie exists (expired or missing)', async () => {
  const res = await verifyPasskeyLoginAction({
    response: {
      id: 'fake_cred_id',
      rawId: 'fake_cred_id',
      type: 'public-key',
      response: {
        clientDataJSON: 'fake_client_data',
        authenticatorData: 'fake_auth_data',
        signature: 'fake_signature',
      },
      clientExtensionResults: {},
    },
  });

  assert.equal(res.success, false);
  assert.ok(res.error);
  assert.ok(
    res.error.toLowerCase().includes('expired') ||
    res.error.toLowerCase().includes('invalid') ||
    res.error.toLowerCase().includes('session')
  );
});

test('verifyPasskeyLoginAction rejects missing WebAuthn assertion response', async () => {
  const res = await verifyPasskeyLoginAction(undefined);
  assert.equal(res.success, false);
  assert.ok(res.error);
});

test('signInWithPasskey provides guidance and fails closed', async () => {
  const res = await signInWithPasskey();
  assert.ok(res.error);
  assert.ok(res.error.toLowerCase().includes('passkey button'));
});

// ── Registration Boundary Tests ────────────────────────────────────────────

test('startPasskeyRegistrationAction requires authenticated admin user', async () => {
  const res = await startPasskeyRegistrationAction();
  assert.equal(res.success, false);
  assert.ok(res.error);
  assert.ok(
    res.error.toLowerCase().includes('unauthorized') ||
    res.error.toLowerCase().includes('administrative')
  );
});

test('verifyPasskeyRegistrationAction requires authenticated admin user', async () => {
  const res = await verifyPasskeyRegistrationAction({
    response: {
      id: 'fake_cred_id',
      rawId: 'fake_cred_id',
      type: 'public-key',
      response: {
        clientDataJSON: 'fake_client_data',
        attestationObject: 'fake_attestation',
      },
      clientExtensionResults: {},
    },
    label: 'Test Key',
  });

  assert.equal(res.success, false);
  assert.ok(res.error);
  assert.ok(
    res.error.toLowerCase().includes('unauthorized') ||
    res.error.toLowerCase().includes('administrative')
  );
});

test('registerPasskeyAction rejects unverified registration shortcuts', async () => {
  const res = await registerPasskeyAction({
    label: 'Shortcut Key',
    credentialId: 'shortcut_id',
  });

  assert.equal(res.success, false);
  assert.ok(res.error);
  assert.ok(res.error.toLowerCase().includes('disabled') || res.error.toLowerCase().includes('unverified'));
});
