import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ErrorView } from '../components/error-view';

test('ErrorView renders user-friendly message without exposing technical details or digests', () => {
  const dummyError = Object.assign(new Error('CRITICAL_DATABASE_FAIL: table users does not exist'), {
    digest: 'DIGEST_SECRET_98765',
  });

  const html = renderToString(
    React.createElement(ErrorView, {
      error: dummyError,
      reset: () => {},
    })
  );

  // Assert user-friendly copy is present
  assert.ok(html.includes('Something went wrong'));
  assert.ok(html.includes('We couldn’t load this page. This is usually temporary.'));
  assert.ok(html.includes('Go back'));
  assert.ok(html.includes('Try again'));

  // Assert technical error details are strictly omitted
  assert.ok(!html.includes('CRITICAL_DATABASE_FAIL'));
  assert.ok(!html.includes('table users does not exist'));
  assert.ok(!html.includes('DIGEST_SECRET_98765'));
  assert.ok(!html.includes('Technical details'));
  assert.ok(!html.includes('Show technical details'));
  assert.ok(!html.includes('Hide technical details'));
});
