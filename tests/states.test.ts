import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import {
  StateView,
  NoSearchResults,
  NoContentState,
  EmptyTableState,
  LoadingState,
  ErrorState,
  NotFoundState,
  UnauthorizedState,
  NoMediaState,
} from "../components/ui/states";

test("StateView renders with custom title and description", () => {
  const element = React.createElement(StateView, {
    title: "Custom Title",
    description: "Custom Description",
    compact: true,
  });
  assert.equal(element.props.title, "Custom Title");
  assert.equal(element.props.description, "Custom Description");
  assert.equal(element.props.compact, true);
});

test("NoSearchResults constructs default title and dynamic query description", () => {
  const withQuery = React.createElement(NoSearchResults, {
    query: "architecture",
  });
  assert.equal(withQuery.type, NoSearchResults);

  const element = NoSearchResults({ query: "architecture" });
  assert.equal(element.props.title, "No results found");
  assert.equal(element.props.description, 'No matches found for "architecture".');
});

test("NoSearchResults handles empty query with fallback description", () => {
  const element = NoSearchResults({});
  assert.equal(element.props.title, "No results found");
  assert.equal(element.props.description, "No items match your filters.");
});

test("NoContentState defaults to human-friendly collection empty text", () => {
  const element = NoContentState({});
  assert.equal(element.props.title, "No entries yet");
  assert.equal(element.props.description, "Nothing has been published here yet.");
});

test("EmptyTableState renders table row with appropriate colSpan", () => {
  const element = EmptyTableState({
    colSpan: 6,
    title: "No records",
    description: "Table is empty",
  });
  assert.equal(element.type, "tr");
  const td = element.props.children;
  assert.equal(td.type, "td");
  assert.equal(td.props.colSpan, 6);
});

test("LoadingState provides accessible status role", () => {
  const element = LoadingState({ title: "Loading entries…" });
  assert.equal(element.props.role, "status");
  assert.equal(element.props["aria-live"], "polite");
});

test("ErrorState provides default error copy and retry action", () => {
  let retried = false;
  const element = ErrorState({
    onRetry: () => {
      retried = true;
    },
  });
  assert.equal(element.props.title, "Something went wrong");
  assert.equal(
    element.props.description,
    "We couldn’t load this content. Please try again."
  );
  assert.ok(element.props.action);
});

test("NotFoundState defaults to 404 messaging and home link", () => {
  const element = NotFoundState({});
  assert.equal(element.props.title, "Page not found");
  assert.ok(element.props.description);
  assert.ok(element.props.action);
});

test("UnauthorizedState provides permission restriction messaging", () => {
  const element = UnauthorizedState({});
  assert.equal(element.props.title, "Access restricted");
  assert.equal(
    element.props.description,
    "You do not have permission to view this page."
  );
  assert.ok(element.props.action);
});

test("NoMediaState renders upload action when onUpload callback is provided", () => {
  let uploaded = false;
  const element = NoMediaState({
    onUpload: () => {
      uploaded = true;
    },
  });
  assert.equal(element.props.title, "No media assets");
  assert.equal(
    element.props.description,
    "Upload images or documents to view them here."
  );
  assert.ok(element.props.action);
});
