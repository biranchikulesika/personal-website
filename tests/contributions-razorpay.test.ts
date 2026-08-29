import assert from "node:assert/strict";
import { test } from "node:test";
import crypto from "node:crypto";
import {
  verifyPaymentSignature,
  verifyWebhookSignature,
  parseRazorpayWebhookEvent,
} from "../lib/razorpay";
import { ContentService } from "../lib/services/content.service";
import { InMemoryTestContentRepository } from "./in-memory-test-content-repository";
import { setContentRepositoryForTesting } from "../lib/repositories";

// ── Cryptographic Signature Verification ───────────────────────────────────

test("verifyPaymentSignature returns true for valid HMAC signature", () => {
  const secret = "test_key_secret_12345";
  const orderId = "order_OXYZ123456789";
  const paymentId = "pay_PXYZ123456789";
  const text = `${orderId}|${paymentId}`;
  const validSignature = crypto
    .createHmac("sha256", secret)
    .update(text)
    .digest("hex");

  const isValid = verifyPaymentSignature({
    orderId,
    paymentId,
    signature: validSignature,
    secret,
  });

  assert.equal(isValid, true, "Valid payment signature must be verified");
});

test("verifyPaymentSignature returns false for tampered signature", () => {
  const secret = "test_key_secret_12345";
  const orderId = "order_OXYZ123456789";
  const paymentId = "pay_PXYZ123456789";

  const isValid = verifyPaymentSignature({
    orderId,
    paymentId,
    signature: "tampered_signature_hex_value_000000000000000000000000000000",
    secret,
  });

  assert.equal(isValid, false, "Tampered signature must fail verification");
});

test("verifyPaymentSignature returns false if missing parameters", () => {
  assert.equal(
    verifyPaymentSignature({
      orderId: "",
      paymentId: "pay_123",
      signature: "sig",
      secret: "secret",
    }),
    false,
  );
  assert.equal(
    verifyPaymentSignature({
      orderId: "order_123",
      paymentId: "",
      signature: "sig",
      secret: "secret",
    }),
    false,
  );
});

test("verifyWebhookSignature returns true for valid webhook payload", () => {
  const secret = "webhook_secret_xyz987";
  const rawBody = JSON.stringify({
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: "pay_987654321",
          amount: 50000,
          currency: "INR",
          status: "captured",
        },
      },
    },
  });

  const validSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const isValid = verifyWebhookSignature({
    rawBody,
    signature: validSignature,
    secret,
  });

  assert.equal(isValid, true, "Valid webhook signature must pass");
});

test("verifyWebhookSignature returns false for modified raw body", () => {
  const secret = "webhook_secret_xyz987";
  const originalBody = JSON.stringify({ event: "payment.captured", amount: 500 });
  const modifiedBody = JSON.stringify({ event: "payment.captured", amount: 5000 });

  const signature = crypto
    .createHmac("sha256", secret)
    .update(originalBody)
    .digest("hex");

  const isValid = verifyWebhookSignature({
    rawBody: modifiedBody,
    signature,
    secret,
  });

  assert.equal(isValid, false, "Modified body must fail webhook signature check");
});

// ── Webhook Event Parser ───────────────────────────────────────────────────

test("parseRazorpayWebhookEvent extracts payment.captured event details", () => {
  const payload = {
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: "pay_C12345",
          order_id: "order_O12345",
          amount: 150000, // 1500 INR
          currency: "INR",
          email: "patron@example.com",
          notes: {
            name: "Aman Sen",
            note: "Thanks for building open tools!",
          },
          created_at: 1711900000,
        },
      },
    },
  };

  const { event, contribution } = parseRazorpayWebhookEvent(payload);

  assert.equal(event, "payment.captured");
  assert.ok(contribution);
  assert.equal(contribution.id, "pay_C12345");
  assert.equal(contribution.paymentId, "pay_C12345");
  assert.equal(contribution.orderId, "order_O12345");
  assert.equal(contribution.amount, 1500); // in Rupees
  assert.equal(contribution.status, "captured");
  assert.equal(contribution.name, "Aman Sen");
  assert.equal(contribution.email, "patron@example.com");
  assert.equal(contribution.note, "Thanks for building open tools!");
  assert.equal(contribution.source, "razorpay");
});

// ── Service Layer & Idempotent Database Storage ────────────────────────────

test("confirmPayment idempotently stores contribution in database", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  const paymentId = "pay_IDEMPOTENT_001";
  const params = {
    paymentId,
    amount: 500,
    name: "Biranchi Supporter",
    email: "supporter@example.com",
    note: "Great work",
    source: "manual" as const,
  };

  // First confirmation
  const firstResult = await service.confirmPayment(params);
  assert.equal(firstResult.id, paymentId);
  assert.equal(firstResult.amount, 500);
  assert.equal(firstResult.status, "captured");

  const contributionsAfterFirst = await service.getContributions();
  assert.equal(contributionsAfterFirst.length, 1);

  // Second confirmation with same payment ID (e.g. client callback + retry)
  const secondResult = await service.confirmPayment(params);
  assert.equal(secondResult.id, paymentId);

  // Must remain exactly 1 contribution (no duplicate inserts!)
  const contributionsAfterSecond = await service.getContributions();
  assert.equal(
    contributionsAfterSecond.length,
    1,
    "Idempotency violation: duplicate contribution record was created",
  );
});

test("processRazorpayWebhook idempotently processes events and stores to DB", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  const webhookSecret = "secret_webhook_test";
  process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;

  const rawPayload = JSON.stringify({
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: "pay_WEBHOOK_999",
          order_id: "order_WEBHOOK_999",
          amount: 250000, // 2500 INR
          currency: "INR",
          email: "webhook_user@example.com",
          notes: {
            name: "Rahul",
            note: "Empowering open source",
          },
          created_at: 1711900000,
        },
      },
    },
  });

  const signature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawPayload)
    .digest("hex");

  // Call webhook processor first time
  const res1 = await service.processRazorpayWebhook(rawPayload, signature);
  assert.equal(res1.success, true);
  assert.equal(res1.event, "payment.captured");
  assert.ok(res1.contribution);
  assert.equal(res1.contribution.id, "pay_WEBHOOK_999");
  assert.equal(res1.contribution.amount, 2500);

  // Check DB
  const stored1 = await service.getContribution("pay_WEBHOOK_999");
  assert.ok(stored1);
  assert.equal(stored1.name, "Rahul");

  // Call webhook processor second time with same event (webhook retry simulation)
  const res2 = await service.processRazorpayWebhook(rawPayload, signature);
  assert.equal(res2.success, true);

  const allContributions = await service.getContributions();
  assert.equal(
    allContributions.length,
    1,
    "Webhook retry must be idempotent and not create duplicate contributions",
  );

  delete process.env.RAZORPAY_WEBHOOK_SECRET;
});

test("getContribution retrieves contribution by id, paymentId, or orderId", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  await service.recordContribution({
    id: "contrib_unique_123",
    paymentId: "pay_multi_search_456",
    orderId: "order_multi_search_789",
    amount: 1000,
    currency: "INR",
    status: "captured",
    name: "Patron Multi",
    createdAt: new Date().toISOString(),
    source: "razorpay",
  });

  const byId = await service.getContribution("contrib_unique_123");
  assert.ok(byId);
  assert.equal(byId.name, "Patron Multi");

  const byPaymentId = await service.getContribution("pay_multi_search_456");
  assert.ok(byPaymentId);
  assert.equal(byPaymentId.id, "contrib_unique_123");

  const byOrderId = await service.getContribution("order_multi_search_789");
  assert.ok(byOrderId);
  assert.equal(byOrderId.id, "contrib_unique_123");
});

// ── API Route Handler Tests ────────────────────────────────────────────────

test("POST /api/contributions accepts valid payment with source: razorpay", async () => {
  const repo = new InMemoryTestContentRepository();
  setContentRepositoryForTesting(repo);
  const { POST } = await import("../app/api/contributions/route");

  const request = new Request("http://localhost:3000/api/contributions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentId: "pay_ROUTE_TEST_001",
      amount: 750,
      name: "API Tester",
      email: "tester@example.com",
      note: "Testing API route",
      source: "razorpay",
    }),
  });

  const response = await POST(request);
  assert.equal(response.status, 200);

  const json = await response.json();
  assert.equal(json.success, true);
  assert.equal(json.contribution.id, "pay_ROUTE_TEST_001");
  assert.equal(json.contribution.amount, 750);
});

test("POST /api/contributions rejects unauthenticated manual contributions with 403", async () => {
  const repo = new InMemoryTestContentRepository();
  setContentRepositoryForTesting(repo);
  const { POST } = await import("../app/api/contributions/route");

  const request = new Request("http://localhost:3000/api/contributions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentId: "pay_FAKE_MANUAL_001",
      amount: 5000,
      name: "Attacker",
      source: "manual",
    }),
  });

  const response = await POST(request);
  assert.equal(response.status, 403);
  const json = await response.json();
  assert.ok(json.error.includes("Unauthorized") || json.error.includes("administrative privileges"));
});

test("POST /api/contributions enforces signature check when RAZORPAY_KEY_SECRET is configured", async () => {
  const repo = new InMemoryTestContentRepository();
  setContentRepositoryForTesting(repo);
  const { POST } = await import("../app/api/contributions/route");

  const secret = "key_secret_test_12345";
  process.env.RAZORPAY_KEY_SECRET = secret;

  // 1. Missing signature when secret is set -> rejects 400
  const unsignedReq = new Request("http://localhost:3000/api/contributions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentId: "pay_UNVERIFIED_123",
      amount: 1000,
      source: "razorpay",
    }),
  });
  const unsignedRes = await POST(unsignedReq);
  assert.equal(unsignedRes.status, 400);

  // 2. Invalid signature -> rejects 400
  const invalidSigReq = new Request("http://localhost:3000/api/contributions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentId: "pay_VALID_123",
      orderId: "order_VALID_123",
      signature: "invalid_tampered_signature_hex",
      amount: 1000,
      source: "razorpay",
    }),
  });
  const invalidSigRes = await POST(invalidSigReq);
  assert.equal(invalidSigRes.status, 400);

  // 3. Valid HMAC signature -> succeeds 200
  const orderId = "order_VALID_123";
  const paymentId = "pay_VALID_123";
  const validSignature = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const validReq = new Request("http://localhost:3000/api/contributions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentId,
      orderId,
      signature: validSignature,
      amount: 1000,
      source: "razorpay",
    }),
  });
  const validRes = await POST(validReq);
  assert.equal(validRes.status, 200);

  delete process.env.RAZORPAY_KEY_SECRET;
});

test("POST /api/contributions rejects invalid requests", async () => {
  const repo = new InMemoryTestContentRepository();
  setContentRepositoryForTesting(repo);
  const { POST } = await import("../app/api/contributions/route");

  const request = new Request("http://localhost:3000/api/contributions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentId: "",
      amount: -10,
    }),
  });

  const response = await POST(request);
  assert.equal(response.status, 400);
});

test("POST /api/webhooks/razorpay processes valid webhook request", async () => {
  const repo = new InMemoryTestContentRepository();
  setContentRepositoryForTesting(repo);
  const { POST } = await import("../app/api/webhooks/razorpay/route");

  const webhookSecret = "secret_route_test";
  process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;

  const rawPayload = JSON.stringify({
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: "pay_WEBHOOK_ROUTE_001",
          amount: 50000,
          currency: "INR",
          notes: {
            name: "Webhook Patron",
          },
          created_at: 1711900000,
        },
      },
    },
  });

  const signature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawPayload)
    .digest("hex");

  const request = new Request("http://localhost:3000/api/webhooks/razorpay", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-razorpay-signature": signature,
    },
    body: rawPayload,
  });

  const response = await POST(request);
  assert.equal(response.status, 200);

  const json = await response.json();
  assert.equal(json.status, "ok");
  assert.equal(json.received, true);
  assert.equal(json.contributionId, "pay_WEBHOOK_ROUTE_001");

  delete process.env.RAZORPAY_WEBHOOK_SECRET;
});

test("POST /api/webhooks/razorpay fails closed with 500 when secret is not configured", async () => {
  const { POST } = await import("../app/api/webhooks/razorpay/route");

  delete process.env.RAZORPAY_WEBHOOK_SECRET;

  const request = new Request("http://localhost:3000/api/webhooks/razorpay", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-razorpay-signature": "some_signature",
    },
    body: JSON.stringify({ event: "payment.captured" }),
  });

  const response = await POST(request);
  assert.equal(response.status, 500);
  const json = await response.json();
  assert.ok(json.error.includes("not configured"));
});

test("POST /api/webhooks/razorpay rejects with 400 when signature header is missing", async () => {
  const { POST } = await import("../app/api/webhooks/razorpay/route");

  process.env.RAZORPAY_WEBHOOK_SECRET = "secret_route_test";

  const request = new Request("http://localhost:3000/api/webhooks/razorpay", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ event: "payment.captured" }),
  });

  const response = await POST(request);
  assert.equal(response.status, 400);

  delete process.env.RAZORPAY_WEBHOOK_SECRET;
});

test("GET /api/contributions forbids unauthenticated full data dumps", async () => {
  const { GET } = await import("../app/api/contributions/route");
  const request = new Request("http://localhost:3000/api/contributions");
  const response = await GET(request);
  assert.equal(response.status, 403);
  const json = await response.json();
  assert.ok(json.error.includes("Unauthorized"));
});

test("GET /api/contributions?id=... sanitizes PII and excludes donor email", async () => {
  const repo = new InMemoryTestContentRepository();
  setContentRepositoryForTesting(repo);
  const service = new ContentService(repo);
  await service.confirmPayment({
    paymentId: "pay_SEC_001",
    amount: 1000,
    name: "Secret Donor",
    email: "secret_donor@private.org",
    note: "Confidential note",
    source: "manual",
  });

  const { GET } = await import("../app/api/contributions/route");
  const request = new Request("http://localhost:3000/api/contributions?id=pay_SEC_001");
  const response = await GET(request);
  assert.equal(response.status, 200);

  const json = await response.json();
  assert.ok(json.contribution);
  assert.equal(json.contribution.id, "pay_SEC_001");
  assert.equal(json.contribution.name, "Secret Donor");
  assert.equal(json.contribution.amount, 1000);
  assert.equal(json.contribution.email, undefined, "Email must not be disclosed in public API");
  assert.equal(json.contribution.note, undefined, "Private notes must not be disclosed in public API");
});
