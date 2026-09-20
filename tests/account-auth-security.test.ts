import assert from "node:assert/strict";
import { test } from "node:test";
import { ContentService } from "../lib/services/content.service";
import { InMemoryTestContentRepository } from "./in-memory-test-content-repository";
import { parseUserAgent } from "../lib/utils";

// ── User Agent & Device Parser ──────────────────────────────────────────────

test("parseUserAgent correctly identifies devices and browsers", () => {
  // MacBook / Chrome
  const macChrome = parseUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
  );
  assert.equal(macChrome.device, "MacBook");
  assert.equal(macChrome.browser, "Chrome");
  assert.equal(macChrome.label, "MacBook / Chrome");

  // Linux / Firefox
  const linuxFirefox = parseUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0"
  );
  assert.equal(linuxFirefox.device, "Linux Computer");
  assert.equal(linuxFirefox.browser, "Firefox");
  assert.equal(linuxFirefox.label, "Linux Computer / Firefox");

  // iPhone / Safari
  const iPhoneSafari = parseUserAgent(
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
  );
  assert.equal(iPhoneSafari.device, "iPhone");
  assert.equal(iPhoneSafari.browser, "Safari");
  assert.equal(iPhoneSafari.label, "iPhone / Safari");

  // Windows / Edge
  const winEdge = parseUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0"
  );
  assert.equal(winEdge.device, "Windows PC");
  assert.equal(winEdge.browser, "Edge");
  assert.equal(winEdge.label, "Windows PC / Edge");

  // Fallback for null/empty
  const fallback = parseUserAgent(null);
  assert.equal(fallback.device, "Current Device");
  assert.equal(fallback.browser, "Web Browser");
});

// ── Passkey Management ──────────────────────────────────────────────────────

test("content service supports passkey management", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  const initialPasskeys = await service.getPasskeys("default");
  assert.ok(initialPasskeys.length >= 1, "should have initial passkey in test repo");
  assert.equal(initialPasskeys[0].label, "Linux Computer");

  // Save new passkey
  const newPasskey = {
    id: "pk-test-phone",
    label: "iPhone Face ID",
    createdAt: new Date().toISOString(),
    lastUsedAt: "Aug 21, 2026",
    credentialId: "cred-iphone-01",
  };
  await service.savePasskey("default", newPasskey);

  const afterSave = await service.getPasskeys("default");
  assert.equal(afterSave.length, initialPasskeys.length + 1);
  const found = afterSave.find((p) => p.id === "pk-test-phone");
  assert.ok(found, "new passkey should be findable");
  assert.equal(found.label, "iPhone Face ID");

  // Delete passkey
  const deleted = await service.deletePasskey("default", "pk-test-phone");
  assert.equal(deleted, true);

  const afterDelete = await service.getPasskeys("default");
  assert.equal(afterDelete.length, initialPasskeys.length);
  assert.equal(afterDelete.find((p) => p.id === "pk-test-phone"), undefined);
});

// ── Active Sessions Management ──────────────────────────────────────────────

test("content service supports active session tracking and revocation", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  // Initial sessions
  const sessions = await service.getSessions("default");
  assert.ok(sessions.length >= 1, "should have initial session");
  assert.equal(sessions[0].isCurrent, true);

  // Record a new session (e.g. phone session)
  const remoteSession = {
    id: "sess-remote-phone",
    userId: "default",
    device: "iPhone / Safari",
    location: "192.168.1.50",
    ipAddress: "192.168.1.50",
    startedAt: "10 minutes ago",
    lastActiveAt: new Date().toISOString(),
    isCurrent: false,
  };
  await service.recordSession(remoteSession);

  const afterRecord = await service.getSessions("default");
  assert.equal(afterRecord.length, sessions.length + 1);

  // Sign out individual session
  const deleted = await service.deleteSession("default", "sess-remote-phone");
  assert.equal(deleted, true);

  const afterSingleDelete = await service.getSessions("default");
  assert.equal(afterSingleDelete.find((s) => s.id === "sess-remote-phone"), undefined);

  // Sign out all sessions
  const deletedAll = await service.deleteAllSessions("default");
  assert.equal(deletedAll, true);

  const afterDeleteAll = await service.getSessions("default");
  assert.equal(afterDeleteAll.length, 0);
});

// ── Connected Accounts & Provider Constraints ───────────────────────────────

test("content service enforces at least one connected auth provider", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  // Initial connected providers
  const providers = await service.getConnectedProviders("default");
  assert.deepEqual(providers, ["google"]);

  // Connect second provider (GitHub)
  await service.connectProvider("default", "github");

  const afterConnect = await service.getConnectedProviders("default");
  assert.ok(afterConnect.includes("google"));
  assert.ok(afterConnect.includes("github"));
  assert.equal(afterConnect.length, 2);

  // Disconnect GitHub (should succeed because Google remains)
  const disconnected = await service.disconnectProvider("default", "github");
  assert.equal(disconnected, true);

  const afterDisconnectGithub = await service.getConnectedProviders("default");
  assert.deepEqual(afterDisconnectGithub, ["google"]);

  // Attempt to disconnect the last remaining provider (Google): MUST FAIL
  await assert.rejects(
    async () => {
      await service.disconnectProvider("default", "google");
    },
    /at least one authentication provider must remain connected/i
  );

  // Ensure Google is still connected
  const afterFailedDisconnect = await service.getConnectedProviders("default");
  assert.deepEqual(afterFailedDisconnect, ["google"]);
});

// ── Passkey Authentication Actions ──────────────────────────────────────────

test("startPasskeyRegistration returns configuration error when unauthenticated", async () => {
  const { startPasskeyRegistration } = await import("../app/admin/login/actions");
  const result = await startPasskeyRegistration();
  // In test environment without active Supabase credentials, returns error
  assert.ok(result.error !== undefined);
});

test("verifyPasskeyLoginAction handles missing environment gracefully", async () => {
  const { verifyPasskeyLoginAction } = await import("../app/admin/login/actions");
  const result = await verifyPasskeyLoginAction({
    credentialId: "test-credential-id",
  });
  // In test environment without Supabase URL/key, safely returns failure object without throwing
  assert.equal(result.success, false);
  assert.ok(result.error !== undefined);
});

