import assert from "node:assert/strict";
import { test } from "node:test";
import { resetDatabase } from "../lib/data/mock-db";
import { ContentService } from "../lib/services/content.service";
import { parseUserAgent } from "../lib/utils";
import {
  registerPasskeyAction,
  deletePasskeyAction,
  connectProviderAction,
  disconnectProviderAction,
  signOutSessionAction,
  signOutAllSessionsAction,
} from "../app/admin/actions";

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
  resetDatabase();
  const service = new ContentService();

  const initialPasskeys = await service.getPasskeys("default");
  assert.ok(initialPasskeys.length >= 1, "should have initial passkey in seed");
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

test("registerPasskeyAction and deletePasskeyAction work end-to-end", async () => {
  resetDatabase();

  const result = await registerPasskeyAction({
    label: "MacBook Touch ID",
    credentialId: "cred-mac-touchid",
  });
  assert.equal(result.success, true);
  assert.ok(result.passkey);
  assert.equal(result.passkey.label, "MacBook Touch ID");

  const deleteResult = await deletePasskeyAction(result.passkey.id);
  assert.equal(deleteResult.success, true);
});

// ── Active Sessions Management ──────────────────────────────────────────────

test("content service supports active session tracking and revocation", async () => {
  resetDatabase();
  const service = new ContentService();

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

test("signOutSessionAction and signOutAllSessionsAction work correctly", async () => {
  resetDatabase();

  // Test sign out remote session
  const singleResult = await signOutSessionAction("some-remote-session");
  assert.equal(singleResult.success, true);

  // Test sign out current session
  const currentResult = await signOutSessionAction("sess-current");
  assert.equal(currentResult.success, true);
  assert.equal(currentResult.redirect, "/admin/login");

  // Test sign out all sessions
  const allResult = await signOutAllSessionsAction();
  assert.equal(allResult.success, true);
  assert.equal(allResult.redirect, "/admin/login");
});

// ── Connected Accounts & Provider Constraints ───────────────────────────────

test("content service and actions enforce at least one connected auth provider", async () => {
  resetDatabase();
  const service = new ContentService();

  // Initial connected providers
  const providers = await service.getConnectedProviders("default");
  assert.deepEqual(providers, ["google"]);

  // Connect second provider (GitHub)
  const connectResult = await connectProviderAction("github");
  assert.equal(connectResult.success, true);

  const afterConnect = await service.getConnectedProviders("default");
  assert.ok(afterConnect.includes("google"));
  assert.ok(afterConnect.includes("github"));
  assert.equal(afterConnect.length, 2);

  // Disconnect GitHub (should succeed because Google remains)
  const disconnectGithub = await disconnectProviderAction("github");
  assert.equal(disconnectGithub.success, true);

  const afterDisconnectGithub = await service.getConnectedProviders("default");
  assert.deepEqual(afterDisconnectGithub, ["google"]);

  // Attempt to disconnect the last remaining provider (Google) — MUST FAIL
  const failDisconnect = await disconnectProviderAction("google");
  assert.equal(failDisconnect.success, false);
  assert.match(
    failDisconnect.error || "",
    /at least one authentication provider must remain connected/i
  );

  // Ensure Google is still connected
  const afterFailedDisconnect = await service.getConnectedProviders("default");
  assert.deepEqual(afterFailedDisconnect, ["google"]);
});
