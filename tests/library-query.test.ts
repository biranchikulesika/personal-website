import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mergeLibraryFilterTokens,
  parseLibraryToken,
  type LibraryFilterToken,
} from "../lib/library-query";

test("filter tokens normalize aliases and comma-separated values", () => {
  const parsed = parseLibraryToken("type=essay,books");
  assert.deepEqual(parsed, {
    kind: "filter",
    token: { key: "type", values: ["post", "book"] },
  });

  assert.deepEqual(parseLibraryToken("status=draft"), {
    kind: "filter",
    token: { key: "status", values: ["unpublished"] },
  });
  assert.deepEqual(parseLibraryToken("persona=Thinker"), {
    kind: "filter",
    token: { key: "persona", values: ["thinker"] },
  });
});

test("filter tokens reject unknown keys and values", () => {
  assert.equal(parseLibraryToken("colour=red"), null);
  assert.equal(parseLibraryToken("type=video"), null);
  assert.equal(parseLibraryToken("type=essay,video"), null);
  assert.equal(parseLibraryToken("type"), null);
  assert.equal(parseLibraryToken(""), null);
});

test("sort tokens accept field plus direction, with sensible defaults", () => {
  assert.deepEqual(parseLibraryToken("sort=updated,asc"), {
    kind: "sort",
    sort: { field: "updated", direction: "asc" },
  });
  assert.deepEqual(parseLibraryToken("sortby=type"), {
    kind: "sort",
    sort: { field: "type", direction: "asc" },
  });
  assert.deepEqual(parseLibraryToken("sort=date"), {
    kind: "sort",
    sort: { field: "date", direction: "desc" },
  });
  assert.equal(parseLibraryToken("sort=updated,sideways"), null);
  assert.equal(parseLibraryToken("sort=colour,asc"), null);
});

test("same-key filters merge without duplicates", () => {
  const first: LibraryFilterToken = { key: "type", values: ["post"] };
  const merged = mergeLibraryFilterTokens([first], {
    key: "type",
    values: ["post", "note"],
  });
  assert.deepEqual(merged, [{ key: "type", values: ["post", "note"] }]);

  const separate = mergeLibraryFilterTokens(merged, {
    key: "status",
    values: ["published"],
  });
  assert.equal(separate.length, 2);
});
