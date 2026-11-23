import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MAX_UPLOAD_BYTES,
  parseImageDataUrl,
  resolveUploadTarget,
} from "../lib/storage/upload";

// Media upload trust boundary: client-supplied names and MIME types decide the
// storage object key, so both are sanitized here.

test("resolveUploadTarget derives a safe object key from client input", () => {
  const { fileName, contentType } = resolveUploadTarget({
    name: "My Holiday Photo (2).JPEG",
    contentType: "image/jpeg",
    size: 2048,
  });

  assert.equal(contentType, "image/jpeg");
  assert.match(fileName, /^My_Holiday_Photo__2_-\d{8}-[0-9a-f]{8}\.jpg$/);
  assert.match(fileName, /^[A-Za-z0-9_-]+\.jpg$/);
});

test("resolveUploadTarget gives two uploads of the same name distinct keys", () => {
  const input = { name: "cover.png", contentType: "image/png", size: 1024 };
  const first = resolveUploadTarget(input);
  const second = resolveUploadTarget(input);

  assert.notEqual(first.fileName, second.fileName);
});

test("resolveUploadTarget falls back to a dated name when none is given", () => {
  const { fileName } = resolveUploadTarget({
    contentType: "image/png",
    size: 1024,
  });

  assert.match(fileName, /^res-\d{8}-[0-9a-f]{8}\.png$/);
});

test("resolveUploadTarget strips MIME parameters before matching", () => {
  const { fileName, contentType } = resolveUploadTarget({
    name: "shot.webp",
    contentType: "image/webp; charset=binary",
    size: 1024,
  });

  assert.equal(contentType, "image/webp");
  assert.match(fileName, /^shot-\d{8}-[0-9a-f]{8}\.webp$/);
});

test("resolveUploadTarget rejects non-images, empty files, and oversized files", () => {
  assert.throws(
    () => resolveUploadTarget({ name: "evil", contentType: "text/html", size: 10 }),
    /Unsupported image type/,
  );
  // SVG is rejected outright: scripts in an uploaded SVG execute when the
  // public object URL is opened directly.
  assert.throws(
    () => resolveUploadTarget({ name: "x.svg", contentType: "image/svg+xml", size: 10 }),
    /Unsupported image type/,
  );
  assert.throws(
    () =>
      resolveUploadTarget({
        name: "huge.jpg",
        contentType: "image/jpeg",
        size: MAX_UPLOAD_BYTES + 1,
      }),
    /too large/,
  );
});

test("parseImageDataUrl rejects SVG and oversized editor images", () => {
  assert.equal(
    parseImageDataUrl("data:image/svg+xml;base64,PHN2Zz48c2NyaXB0Pg=="),
    null,
    "SVG data URLs must never reach storage",
  );
  assert.equal(
    parseImageDataUrl(`data:image/png;base64,${"A".repeat(MAX_UPLOAD_BYTES * 2)}`),
    null,
    "oversized data URLs must be rejected before allocation",
  );

  const valid = parseImageDataUrl("data:image/png;base64,aGVsbG8=");
  assert.equal(valid?.mimeType, "image/png");
  assert.equal(valid?.ext, "png");
  assert.equal(valid?.buffer.toString(), "hello");
});