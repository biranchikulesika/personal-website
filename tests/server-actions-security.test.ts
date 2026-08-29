import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  savePostAction,
  togglePostStatusAction,
  deletePostAction,
  saveNoteAction,
  toggleNoteStatusAction,
  deleteNoteAction,
  saveBookAction,
  deleteBookAction,
  saveNowEntryAction,
  deleteNowEntryAction,
  addMediaAction,
  deleteMediaAction,
  deleteOrphanedMediaAction,
  setFeaturedPostsAction,
  setFeaturedBooksAction,
  generateAiMetadataAction,
  deleteSubscriberAction,
  getPasskeysAction,
  startPasskeyRegistrationAction,
  verifyPasskeyRegistrationAction,
  registerPasskeyAction,
  deletePasskeyAction,
  getSessionsAction,
  signOutSessionAction,
  signOutAllSessionsAction,
  connectProviderAction,
  disconnectProviderAction,
  getAllPostsAction,
  getAllNotesAction,
  getAllBooksAction,
  getNowEntriesAction,
  getMediaAction,
} from '../app/admin/actions';
import {
  verifyPasskeyLoginAction,
  signInWithPasskey,
  startPasskeyRegistration,
} from '../app/admin/login/actions';

// ── Passkey Authentication Hardening Tests ─────────────────────────────────

test('verifyPasskeyLoginAction fails closed without minting unverified admin sessions', async () => {
  const result = await verifyPasskeyLoginAction({
    credentialId: 'arbitrary-unverified-credential-id',
  });
  assert.equal(result.success, false);
  assert.ok(result.error);
  assert.ok(
    result.error.toLowerCase().includes('expired') ||
    result.error.toLowerCase().includes('invalid') ||
    result.error.toLowerCase().includes('failed') ||
    result.error.toLowerCase().includes('session')
  );
});

test('signInWithPasskey fails closed and returns guidance error', async () => {
  const result = await signInWithPasskey();
  assert.ok(result.error);
  assert.ok(result.error.toLowerCase().includes('passkey button'));
});

test('startPasskeyRegistration requires authenticated user', async () => {
  const result = await startPasskeyRegistration();
  assert.ok(result.error);
});

// ── Administrative Server Actions Authorization Tests ──────────────────────

test('unauthenticated caller cannot save post via savePostAction', async () => {
  const res = await savePostAction({
    slug: 'unauthorized-post',
    title: 'Hacked Title',
    description: 'Hacked',
    tags: ['test'],
    publishedAt: '2026-08-29',
    lastEditedAt: '2026-08-29',
    targetAudience: 'Test',
    intro: [],
    sections: [],
    books: [],
    status: 'published',
  });
  assert.equal(res.success, false);
  assert.ok(res.error?.includes('Unauthorized') || res.error?.includes('Authentication'));
});

test('unauthenticated caller cannot toggle post status via togglePostStatusAction', async () => {
  const res = await togglePostStatusAction('test-post');
  assert.equal(res.success, false);
  assert.ok(res.error?.includes('Unauthorized') || res.error?.includes('Authentication'));
});

test('unauthenticated caller cannot delete post via deletePostAction', async () => {
  const res = await deletePostAction('test-post');
  assert.equal(res.success, false);
  assert.ok(res.error?.includes('Unauthorized') || res.error?.includes('Authentication'));
});

test('unauthenticated caller cannot save note via saveNoteAction', async () => {
  const res = await saveNoteAction({
    id: 'note-unauth',
    slug: 'note-unauth',
    title: 'Hacked Note',
    description: 'Hacked',
    content: ['Hacked'],
    date: '2026-08-29',
    persona: 'builder',
    tags: ['test'],
  });
  assert.equal(res.success, false);
  assert.ok(res.error?.includes('Unauthorized') || res.error?.includes('Authentication'));
});

test('unauthenticated caller cannot toggle note status via toggleNoteStatusAction', async () => {
  const res = await toggleNoteStatusAction('test-note');
  assert.equal(res.success, false);
  assert.ok(res.error?.includes('Unauthorized') || res.error?.includes('Authentication'));
});

test('unauthenticated caller cannot delete note via deleteNoteAction', async () => {
  const res = await deleteNoteAction('test-note');
  assert.equal(res.success, false);
  assert.ok(res.error?.includes('Unauthorized') || res.error?.includes('Authentication'));
});

test('unauthenticated caller cannot save book via saveBookAction', async () => {
  const res = await saveBookAction({
    id: 'book-unauth',
    slug: 'book-unauth',
    title: 'Hacked Book',
    author: 'Attacker',
    description: 'Hacked',
    date: '2026',
    persona: 'thinker',
    tags: ['test'],
  });
  assert.equal(res.success, false);
  assert.ok(res.error?.includes('Unauthorized') || res.error?.includes('Authentication'));
});

test('unauthenticated caller cannot delete book via deleteBookAction', async () => {
  const res = await deleteBookAction('test-book');
  assert.equal(res.success, false);
  assert.ok(res.error?.includes('Unauthorized') || res.error?.includes('Authentication'));
});

test('unauthenticated caller cannot save now entry via saveNowEntryAction', async () => {
  const res = await saveNowEntryAction({
    id: 'now-unauth',
    title: 'Hacked Now',
    date: 'Aug 2026',
    content: 'Hacked content',
  });
  assert.equal(res.success, false);
  assert.ok(res.error?.includes('Unauthorized') || res.error?.includes('Authentication'));
});

test('unauthenticated caller cannot delete now entry via deleteNowEntryAction', async () => {
  const res = await deleteNowEntryAction('now-unauth');
  assert.equal(res.success, false);
  assert.ok(res.error?.includes('Unauthorized') || res.error?.includes('Authentication'));
});

test('unauthenticated caller cannot add media via addMediaAction', async () => {
  const res = await addMediaAction({
    id: 'media-unauth',
    name: 'hacked.png',
    src: '/media/hacked.png',
    alt: 'Hacked',
    size: '10KB',
    uploadedAt: '2026-08-29',
    tag: 'atmosphere',
  });
  assert.equal(res.success, false);
  assert.ok(res.error?.includes('Unauthorized') || res.error?.includes('Authentication'));
});

test('unauthenticated caller cannot delete media via deleteMediaAction', async () => {
  const res = await deleteMediaAction('media-unauth');
  assert.equal(res.success, false);
  assert.ok(res.error?.includes('Unauthorized') || res.error?.includes('Authentication'));
});

test('unauthenticated caller cannot delete orphaned media via deleteOrphanedMediaAction', async () => {
  const res = await deleteOrphanedMediaAction(['/media/test.png']);
  assert.equal(res.success, false);
  assert.ok(res.error?.includes('Unauthorized') || res.error?.includes('Authentication'));
});

test('unauthenticated caller cannot invoke AI metadata generation via generateAiMetadataAction', async () => {
  const res = await generateAiMetadataAction({
    title: 'Test Title',
    content: 'Test Body Content',
  });
  assert.equal(res.success, false);
  assert.ok(res.error?.includes('Unauthorized') || res.error?.includes('Authentication'));
});

test('unauthenticated caller cannot set featured posts or books', async () => {
  const postsRes = await setFeaturedPostsAction(['slug-1', 'slug-2']);
  assert.equal(postsRes.success, false);
  assert.ok(postsRes.error?.includes('Unauthorized') || postsRes.error?.includes('Authentication'));

  const booksRes = await setFeaturedBooksAction(['book-1', 'book-2']);
  assert.equal(booksRes.success, false);
  assert.ok(booksRes.error?.includes('Unauthorized') || booksRes.error?.includes('Authentication'));
});

test('unauthenticated caller cannot delete newsletter subscriber via deleteSubscriberAction', async () => {
  const res = await deleteSubscriberAction('sub_123');
  assert.equal(res.success, false);
  assert.ok(res.error?.includes('Unauthorized') || res.error?.includes('Authentication'));
});

test('unauthenticated caller cannot register or delete passkeys', async () => {
  const startRegRes = await startPasskeyRegistrationAction();
  assert.equal(startRegRes.success, false);
  assert.ok(startRegRes.error?.includes('Unauthorized') || startRegRes.error?.includes('Administrative'));

  const regRes = await registerPasskeyAction({ label: 'Hacked Key' });
  assert.equal(regRes.success, false);
  assert.ok(regRes.error?.includes('disabled') || regRes.error?.includes('Unverified'));

  const delRes = await deletePasskeyAction('pk_123');
  assert.equal(delRes.success, false);
  assert.ok(delRes.error?.includes('Unauthorized') || delRes.error?.includes('Authentication'));
});

test('unauthenticated caller cannot manage sessions or providers', async () => {
  const signoutRes = await signOutSessionAction('sess_123');
  assert.equal(signoutRes.success, false);

  const signoutAllRes = await signOutAllSessionsAction();
  assert.equal(signoutAllRes.success, false);

  const connectRes = await connectProviderAction('github');
  assert.equal(connectRes.success, false);

  const disconnectRes = await disconnectProviderAction('github');
  assert.equal(disconnectRes.success, false);
});

test('unauthenticated read actions throw or reject on protected content', async () => {
  await assert.rejects(async () => {
    await getAllPostsAction();
  }, /Unauthorized/i);

  await assert.rejects(async () => {
    await getAllNotesAction();
  }, /Unauthorized/i);

  await assert.rejects(async () => {
    await getAllBooksAction();
  }, /Unauthorized/i);

  await assert.rejects(async () => {
    await getNowEntriesAction();
  }, /Unauthorized/i);

  await assert.rejects(async () => {
    await getMediaAction();
  }, /Unauthorized/i);

  await assert.rejects(async () => {
    await getPasskeysAction();
  }, /Unauthorized/i);

  await assert.rejects(async () => {
    await getSessionsAction();
  }, /Unauthorized/i);
});
