import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { sanitizeErrorMessage } from '@/lib/errors';
import { toastStore } from '@/components/ui/toast/toast-store';
import { toast } from '@/lib/toast';
import { ToastContainer } from '@/components/ui/toast/toast-container';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

describe('Centralised Error Handling & Sanitization', () => {
  it('returns fallback message when error is null or undefined', () => {
    assert.equal(
      sanitizeErrorMessage(null),
      'An unexpected error occurred. Please try again.',
    );
    assert.equal(
      sanitizeErrorMessage(undefined, 'Custom fallback'),
      'Custom fallback',
    );
  });

  it('scrubs raw SQL queries and returns a friendly message', () => {
    const rawSql =
      'SELECT id, title, slug FROM posts WHERE status = \'published\'; relation "posts" does not exist';
    const sanitized = sanitizeErrorMessage(rawSql);
    assert.equal(sanitized.includes('SELECT'), false);
    assert.equal(sanitized.includes('posts'), false);
    assert.equal(sanitized, 'An unexpected error occurred. Please try again.');
  });

  it('scrubs PostgreSQL and Drizzle errors with duplicate keys into friendly messages', () => {
    const duplicateError = new Error(
      'error: duplicate key value violates unique constraint "posts_slug_unique" (drizzle-orm/postgres)',
    );
    const sanitized = sanitizeErrorMessage(duplicateError);
    assert.equal(sanitized.includes('drizzle'), false);
    assert.equal(sanitized.includes('posts_slug_unique'), false);
    assert.equal(
      sanitized,
      'An item with this title or identifier already exists. Please choose a different one.',
    );
  });

  it('scrubs auth / jwt / permission errors into friendly messages', () => {
    const authError = new Error('JWT expired or invalid permission');
    const sanitized = sanitizeErrorMessage(authError);
    assert.equal(
      sanitized,
      'Unauthorized: You do not have permission to perform this action. Please sign in again.',
    );
  });

  it('scrubs network/fetch failures into connection guidance', () => {
    const netError = new Error('fetch failed: ECONNREFUSED 127.0.0.1:5432');
    const sanitized = sanitizeErrorMessage(netError);
    assert.equal(
      sanitized,
      'Network connection issue. Please check your internet connection and try again.',
    );
  });

  it('preserves clean, user-friendly messages', () => {
    const friendlyMessage = 'Please provide a document title before saving.';
    assert.equal(sanitizeErrorMessage(friendlyMessage), friendlyMessage);

    const friendlyError = new Error('Slug "my-essay" is already in use.');
    assert.equal(
      sanitizeErrorMessage(friendlyError),
      'Slug "my-essay" is already in use.',
    );
  });
});

describe('Centralised Toast Notification System', () => {
  it('adds and dismisses toasts correctly', () => {
    toastStore.dismissAll();

    const id = toast.success('Article published successfully.');
    assert.ok(id);

    const toasts = toastStore.getToasts();
    assert.equal(toasts.length, 1);
    assert.equal(toasts[0].message, 'Article published successfully.');
    assert.equal(toasts[0].type, 'success');

    toast.dismiss(id);
    assert.equal(toastStore.getToasts().length, 0);
  });

  it('deduplicates identical messages of the same type', () => {
    toastStore.dismissAll();

    const id1 = toast.info('Link copied to clipboard.');
    const id2 = toast.info('Link copied to clipboard.');

    assert.equal(id1, id2);
    assert.equal(toastStore.getToasts().length, 1);

    toastStore.dismissAll();
  });

  it('caps active toasts at 4 to prevent viewport clutter', () => {
    toastStore.dismissAll();

    toast.info('Message 1');
    toast.info('Message 2');
    toast.info('Message 3');
    toast.info('Message 4');
    toast.info('Message 5');

    const active = toastStore.getToasts();
    assert.equal(active.length, 4);
    assert.equal(active[0].message, 'Message 2');
    assert.equal(active[3].message, 'Message 5');

    toastStore.dismissAll();
  });

  it('handles toast.promise for resolved and rejected states', async () => {
    toastStore.dismissAll();

    // Test resolved promise
    const result = await toast.promise(
      Promise.resolve('saved-id'),
      {
        loading: 'Saving article...',
        success: 'Article published successfully.',
        error: 'Failed to publish article.',
      },
    );

    assert.equal(result, 'saved-id');
    const toasts = toastStore.getToasts();
    assert.equal(toasts.length, 1);
    assert.equal(toasts[0].message, 'Article published successfully.');
    assert.equal(toasts[0].type, 'success');

    toastStore.dismissAll();

    // Test rejected promise
    await assert.rejects(async () => {
      await toast.promise(
        Promise.reject(new Error('Network error')),
        {
          loading: 'Saving article...',
          success: 'Article published successfully.',
          error: 'Failed to publish article. Please try again.',
        },
      );
    });

    const errorToasts = toastStore.getToasts();
    assert.equal(errorToasts.length, 1);
    assert.equal(errorToasts[0].message, 'Failed to publish article. Please try again.');
    assert.equal(errorToasts[0].type, 'error');

    toastStore.dismissAll();
  });

  it('renders toasts with colorless monochromatic icons and without a close cross button', () => {
    toastStore.dismissAll();
    toast.success('Saved draft successfully.');
    toast.error('Failed to save.');

    const html = renderToString(React.createElement(ToastContainer));
    // Verify messages appear
    assert.ok(html.includes('Saved draft successfully.'));
    assert.ok(html.includes('Failed to save.'));
    // Verify no close cross button
    assert.equal(html.includes('Dismiss notification'), false);
    // Verify colorless icon styling (no colored utility classes)
    assert.equal(html.includes('text-emerald-'), false);
    assert.equal(html.includes('text-rose-'), false);
    assert.equal(html.includes('text-amber-'), false);
    assert.equal(html.includes('text-sea-blue'), false);
    assert.ok(html.includes('bg-paper/10 text-paper'));

    toastStore.dismissAll();
  });
});

describe('Reusable Confirmation Dialog', () => {
  it('renders nothing when closed', () => {
    const html = renderToString(
      React.createElement(ConfirmDialog, {
        isOpen: false,
        onClose: () => {},
        onConfirm: () => {},
        title: 'Delete Essay?',
        description: 'Are you sure you want to delete this essay?',
      }),
    );
    assert.equal(html, '');
  });

  it('renders dialog elements with accessible ARIA attributes when open', () => {
    const html = renderToString(
      React.createElement(ConfirmDialog, {
        isOpen: true,
        onClose: () => {},
        onConfirm: () => {},
        title: 'Delete Article?',
        description: 'Are you sure you want to delete this article?',
        confirmLabel: 'Delete',
        variant: 'danger',
      }),
    );

    assert.ok(html.includes('role="alertdialog"'));
    assert.ok(html.includes('aria-modal="true"'));
    assert.ok(html.includes('Delete Article?'));
    assert.ok(html.includes('Are you sure you want to delete this article?'));
    assert.ok(html.includes('Delete'));
    assert.ok(html.includes('Cancel'));
  });

  it('renders type-to-confirm input when specified', () => {
    const html = renderToString(
      React.createElement(ConfirmDialog, {
        isOpen: true,
        onClose: () => {},
        onConfirm: () => {},
        title: 'Permanently Delete Post?',
        description: 'Type the title to confirm deletion.',
        typeToConfirm: 'The Craft of Code',
        confirmLabel: 'Confirm Delete',
      }),
    );

    assert.ok(html.includes('The Craft of Code'));
    assert.ok(html.includes('to confirm:'));
    assert.ok(html.includes('input'));
  });
});
