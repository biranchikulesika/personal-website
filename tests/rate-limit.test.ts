import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";
import {
  RATE_LIMIT_CACHE_CAP,
  checkInMemoryRateLimit,
  clearRateLimitCache,
  rateLimitCacheSize,
  rateLimitKey,
} from "../lib/rate-limit";

describe("rateLimitKey", () => {
  test("prefers platform-set client IP headers in order", () => {
    const request = new Request("https://example.com/api/og", {
      headers: {
        "cf-connecting-ip": "1.1.1.1",
        "x-vercel-forwarded-for": "2.2.2.2",
        "x-forwarded-for": "3.3.3.3, 4.4.4.4",
      },
    });
    assert.equal(rateLimitKey(request, "og"), "og:1.1.1.1");

    const vercel = new Headers({
      "x-vercel-forwarded-for": "2.2.2.2, 5.5.5.5",
      "x-forwarded-for": "3.3.3.3",
    });
    assert.equal(rateLimitKey(vercel, "og"), "og:2.2.2.2");

    const forwarded = new Headers({ "x-forwarded-for": "3.3.3.3, 4.4.4.4" });
    assert.equal(rateLimitKey(forwarded, "newsletter"), "newsletter:3.3.3.3");

    assert.equal(rateLimitKey(new Headers(), "login"), "login:unknown");
  });
});

describe("in-memory rate limit fallback", () => {
  beforeEach(() => clearRateLimitCache());

  test("blocks after N attempts and resets after the window", () => {
    const key = "test:attempts";
    assert.equal(checkInMemoryRateLimit(key, 2, 60, 0), true);
    assert.equal(checkInMemoryRateLimit(key, 2, 60, 1000), true);
    assert.equal(checkInMemoryRateLimit(key, 2, 60, 2000), false);
    assert.equal(checkInMemoryRateLimit(key, 2, 60, 59_999), false);
    assert.equal(checkInMemoryRateLimit(key, 2, 60, 60_000), true);
  });

  test("purges expired entries and caps map size", () => {
    checkInMemoryRateLimit("test:old", 1, 1, 0);
    assert.equal(rateLimitCacheSize(), 1);
    checkInMemoryRateLimit("test:new", 1, 60, 2000);
    assert.equal(rateLimitCacheSize(), 1, "expired entry must be purged");

    for (let i = 0; i < RATE_LIMIT_CACHE_CAP + 2; i++) {
      checkInMemoryRateLimit(`test:fill:${i}`, 1, 60, 2000);
    }
    assert.equal(rateLimitCacheSize(), RATE_LIMIT_CACHE_CAP);
    assert.equal(
      checkInMemoryRateLimit("test:fill:0", 1, 60, 2000),
      true,
      "oldest entry must be evicted once the map is full",
    );
    assert.equal(rateLimitCacheSize(), RATE_LIMIT_CACHE_CAP);
  });
});
