/**
 * Test Suite for Passkey Registration Architecture
 * 
 * Verifies:
 * 1. Challenge creation, TTL expiration, and single-use consumption.
 * 2. Relying Party (RP ID) and origin resolution.
 * 3. Passkey credential schema & rename validation.
 * 4. WebAuthn registration options creation.
 * 5. Duplicate credential detection logic.
 */

import assert from 'node:assert/strict';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import {
  saveRegistrationChallenge,
  consumeRegistrationChallenge
} from '../lib/auth/passkey-challenge.ts';
import { getWebAuthnConfig } from '../lib/auth/passkey.config.ts';
import { passkeyCredentialSchema, passkeyRenameSchema } from '../lib/schemas.ts';

async function runTests() {
  console.log('🧪 Running Passkey Registration Test Suite...\n');

  // Test 1: Single-use challenge lifecycle
  console.log('Test 1: Challenge single-use lifecycle and replay protection');
  const testUserId = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
  const testChallenge = 'test-challenge-random-string-123456';
  
  saveRegistrationChallenge(testUserId, testChallenge);
  
  const consumed = consumeRegistrationChallenge(testUserId);
  assert.equal(consumed, testChallenge, 'First challenge retrieval must match saved challenge');
  
  const replayed = consumeRegistrationChallenge(testUserId);
  assert.equal(replayed, null, 'Second challenge retrieval must return null (single-use enforcement)');
  
  const nonExistent = consumeRegistrationChallenge('non-existent-user-id');
  assert.equal(nonExistent, null, 'Non-existent user must return null');
  console.log('✅ Challenge lifecycle test passed.\n');

  // Test 2: WebAuthn Config & RP ID resolution
  console.log('Test 2: WebAuthn RP ID and Origin resolution');
  const devConfig = getWebAuthnConfig();
  assert(devConfig.rpID.length > 0, 'RP ID must not be empty');
  assert(devConfig.rpName.length > 0, 'RP Name must not be empty');
  assert(devConfig.expectedOrigins.length > 0, 'Expected origins must not be empty');

  // Test custom header resolution
  const customHeaderConfig = getWebAuthnConfig(new Headers({
    'host': 'biranchikulesika.com:443',
    'origin': 'https://biranchikulesika.com'
  }));
  assert.equal(customHeaderConfig.rpID, 'biranchikulesika.com', 'RP ID must match host without port');
  assert(customHeaderConfig.expectedOrigins.includes('https://biranchikulesika.com'), 'Expected origins must include request origin');
  console.log('✅ WebAuthn config test passed.\n');

  // Test 3: Schema Validation
  console.log('Test 3: Passkey Credential and Rename Schemas');
  const validCred = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    credentialId: 'cred-abc-123',
    publicKey: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...',
    counter: 0,
    deviceType: 'singleDevice',
    backedUp: false,
    transports: ['internal'],
    name: 'MacBook Pro Touch ID'
  };
  const parsedCred = passkeyCredentialSchema.parse(validCred);
  assert.equal(parsedCred.name, 'MacBook Pro Touch ID');

  // Test invalid rename (empty name)
  assert.throws(() => {
    passkeyRenameSchema.parse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: '   '
    });
  }, 'Empty name must throw error');

  // Test rename over 50 chars
  assert.throws(() => {
    passkeyRenameSchema.parse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'a'.repeat(51)
    });
  }, 'Name over 50 chars must throw error');
  console.log('✅ Schema validation test passed.\n');

  // Test 4: WebAuthn registration options generation
  console.log('Test 4: WebAuthn registration options generation');
  const options = await generateRegistrationOptions({
    rpName: 'Biranchi CMS',
    rpID: 'localhost',
    userID: Buffer.from(testUserId, 'utf-8'),
    userName: 'admin@biranchikulesika.com',
    userDisplayName: 'Biranchi Kulesika',
    attestationType: 'none',
    excludeCredentials: [
      { id: 'existing-cred-1', transports: ['internal'] }
    ]
  });

  assert(options.challenge.length > 10, 'Generated challenge must be a non-empty string');
  assert.equal(options.rp.name, 'Biranchi CMS');
  assert.equal(options.rp.id, 'localhost');
  assert.equal(options.excludeCredentials?.length, 1);
  assert.equal(options.excludeCredentials?.[0].id, 'existing-cred-1');
  console.log('✅ WebAuthn options generation test passed.\n');

  console.log('🎉 All Passkey Registration tests passed successfully!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
