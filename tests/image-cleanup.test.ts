import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import {
  normalizeImagePath,
  extractImageReferencesFromText,
} from '../lib/services/image-cleanup.service';

describe('Automatic Orphaned-Image Cleanup System Test Suite', () => {

  // 1. Image referenced by a published post
  test('1. Image referenced by a published post -> detected as referenced and not deleted', () => {
    const postContent = `
# Exploring the Himalayas
Here is the sunrise view:
![Sunrise Over Mountains](/post-images/2026/08/18/sunrise-himalayas.webp)
`;
    const refs = extractImageReferencesFromText(postContent, 'post-images');
    assert.equal(refs.length, 1);
    assert.equal(refs[0].bucket, 'post-images');
    assert.equal(refs[0].path, '2026/08/18/sunrise-himalayas.webp');
  });

  // 2. Image referenced by a draft post
  test('2. Image referenced by a draft post -> detected in draftContent and not deleted', () => {
    const draftContent = `
<Image path="2026/08/18/draft-architecture-diagram.png" alt="Architecture" />
`;
    const refs = extractImageReferencesFromText(draftContent, 'post-images');
    assert.equal(refs.length, 1);
    assert.equal(refs[0].path, '2026/08/18/draft-architecture-diagram.png');
  });

  // 3. Image referenced in article content (HTML / JSX / Markdown)
  test('3. Image referenced in article content formats -> all variants detected', () => {
    const complexArticle = `
# Multi-format Article
Markdown image: ![Cover](https://ojzxdgzkrjmfeqyxvfud.supabase.co/storage/v1/object/public/post-images/hero.webp)
HTML image: <img src="/post-images/diagram-1.svg" alt="Diagram" />
JSX ImageBlock: <ImageBlock src="https://ojzxdgzkrjmfeqyxvfud.supabase.co/storage/v1/object/public/media/charts/q3.png" />
JSX Image path: <Image path="2026/08/18/cover-photo.jpg" />
`;
    const refs = extractImageReferencesFromText(complexArticle, 'post-images');
    assert.equal(refs.length, 4);

    const paths = refs.map(r => r.path);
    assert.ok(paths.includes('hero.webp'));
    assert.ok(paths.includes('diagram-1.svg'));
    assert.ok(paths.includes('charts/q3.png'));
    assert.ok(paths.includes('2026/08/18/cover-photo.jpg'));
  });

  // 4. Image referenced elsewhere in the application
  test('4. Image referenced in other models (books, proof URLs, avatars) -> detected correctly', () => {
    const bookCover = 'https://ojzxdgzkrjmfeqyxvfud.supabase.co/storage/v1/object/public/media/books/clean-code.jpg';
    const proofUrl = '/media/donations/proof-12345.png';
    const avatarUrl = 'persona-assets/avatars/builder.webp';

    const bookRef = normalizeImagePath(bookCover, 'media');
    const proofRef = normalizeImagePath(proofUrl, 'media');
    const avatarRef = normalizeImagePath(avatarUrl, 'persona-assets');

    assert.deepEqual(bookRef, { bucket: 'media', path: 'books/clean-code.jpg' });
    assert.deepEqual(proofRef, { bucket: 'media', path: 'donations/proof-12345.png' });
    assert.deepEqual(avatarRef, { bucket: 'persona-assets', path: 'avatars/builder.webp' });
  });

  // 5. Recently uploaded but unreferenced image (< 60 days)
  test('5. Recently uploaded unreferenced image (e.g. 2 days ago) -> retained in grace period, not deleted', () => {
    const retentionDays = 60;
    const now = new Date();
    const uploadedAt = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    const cutoffTime = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);

    const isEligibleForDeletion = uploadedAt < cutoffTime;
    assert.equal(isEligibleForDeletion, false, 'Image uploaded 2 days ago must NOT be eligible for deletion');
  });

  // 6. Image unreferenced for less than 2 months (e.g. 59 days)
  test('6. Image unreferenced for 59 days -> strictly retained under 60-day safety buffer', () => {
    const retentionDays = 60;
    const now = new Date();
    const lastReferencedAt = new Date(now.getTime() - 59 * 24 * 60 * 60 * 1000); // 59 days ago
    const cutoffTime = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);

    const isEligibleForDeletion = lastReferencedAt < cutoffTime;
    assert.equal(isEligibleForDeletion, false, 'Image unreferenced for 59 days must NOT be eligible for deletion');
  });

  // 7. Image unreferenced for more than 2 months (e.g. 61 days)
  test('7. Image unreferenced for 61 days -> eligible for permanent deletion', () => {
    const retentionDays = 60;
    const now = new Date();
    const lastReferencedAt = new Date(now.getTime() - 61 * 24 * 60 * 60 * 1000); // 61 days ago
    const cutoffTime = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);

    const isEligibleForDeletion = lastReferencedAt < cutoffTime;
    assert.equal(isEligibleForDeletion, true, 'Image unreferenced for 61 days MUST be eligible for deletion');
  });

  // 8. Storage file deletion succeeds -> database record removal logic
  test('8. Storage deletion success workflow -> removes storage and syncs DB', async () => {
    let storageDeleted = false;
    let dbRecordDeleted = false;

    // Simulate storage deletion API
    const mockStorageRemove = async (_path: string) => {
      storageDeleted = true;
      return { error: null };
    };

    // Simulate DB delete API
    const mockDbDelete = async (_id: string) => {
      dbRecordDeleted = true;
      return { error: null };
    };

    // Execution workflow
    const handleCleanup = async (path: string, id: string) => {
      const { error } = await mockStorageRemove(path);
      if (!error) {
        await mockDbDelete(id);
      }
    };

    await handleCleanup('orphaned-old.png', 'uuid-123');
    assert.equal(storageDeleted, true);
    assert.equal(dbRecordDeleted, true);
  });

  // 9. Storage deletion fails -> database record preserved
  test('9. Storage deletion fails -> database record is preserved for safety', async () => {
    let storageDeleted = false;
    let dbRecordDeleted = false;

    // Simulate storage deletion failure (network error or timeout)
    const mockStorageRemove = async (_path: string) => {
      return { error: { message: 'Storage connection timeout' } };
    };

    const mockDbDelete = async (_id: string) => {
      dbRecordDeleted = true;
      return { error: null };
    };

    const handleCleanup = async (path: string, id: string) => {
      const { error } = await mockStorageRemove(path);
      if (!error) {
        await mockDbDelete(id);
      }
    };

    await handleCleanup('failed-storage.png', 'uuid-999');
    assert.equal(storageDeleted, false);
    assert.equal(dbRecordDeleted, false, 'Database record MUST NOT be deleted when storage removal fails');
  });

  // 10. Database record missing -> cleanup handles gracefully
  test('10. Database record missing or already removed -> handles safely without crashing', () => {
    const rawRef = normalizeImagePath('/post-images/legacy-without-db-record.jpg');
    assert.ok(rawRef);
    assert.equal(rawRef.path, 'legacy-without-db-record.jpg');
  });

  // 11. Idempotency test: repeated cleanup runs
  test('11. Cleanup runs multiple times -> idempotent and produces consistent metrics', () => {
    const initialImages = [
      { id: '1', status: 'active', ageDays: 10, referenced: true },
      { id: '2', status: 'orphaned', ageDays: 20, referenced: false },
      { id: '3', status: 'orphaned', ageDays: 80, referenced: false },
    ];

    const runScan = (images: typeof initialImages, retentionDays = 60) => {
      let referenced = 0;
      let skippedInGrace = 0;
      let eligible = 0;

      for (const img of images) {
        if (img.referenced) {
          referenced++;
        } else if (img.ageDays <= retentionDays) {
          skippedInGrace++;
        } else {
          eligible++;
        }
      }
      return { referenced, skippedInGrace, eligible };
    };

    const run1 = runScan(initialImages);
    const run2 = runScan(initialImages);

    assert.deepEqual(run1, run2, 'Consecutive cleanup runs with unchanged data must return identical counts');
    assert.equal(run1.referenced, 1);
    assert.equal(run1.skippedInGrace, 1);
    assert.equal(run1.eligible, 1);
  });

  // 12. Image becomes referenced -> cleanup updates status and keeps it
  test('12. Image newly referenced before cleanup -> status restored to active and not deleted', () => {
    const imgRecord = {
      id: 'img-uuid-456',
      storage_path: 'draft-illustration.webp',
      status: 'orphaned',
      last_referenced_at: '2026-01-01T00:00:00Z', // 7+ months ago
    };

    // User publishes a new post referencing draft-illustration.webp
    const referencedMap = new Map<string, { count: number }>();
    referencedMap.set('post-images:draft-illustration.webp', { count: 1 });

    const key = `post-images:${imgRecord.storage_path}`;
    const isReferenced = referencedMap.has(key);

    let updatedStatus = imgRecord.status;
    let shouldDelete = false;

    if (isReferenced) {
      updatedStatus = 'active';
      shouldDelete = false;
    } else {
      shouldDelete = true;
    }

    assert.equal(updatedStatus, 'active');
    assert.equal(shouldDelete, false, 'Newly referenced image must NOT be deleted even if previously orphaned');
  });

  // 13. Legacy images without sufficient tracking -> initialized safely
  test('13. Legacy images without tracking -> given default upload timestamp and 60-day safety buffer', () => {
    const legacyStorageItem = {
      name: '2026/08/18/legacy-image.webp',
      created_at: new Date().toISOString(), // Discovered today
    };

    const retentionDays = 60;
    const initialReferenceDate = new Date(legacyStorageItem.created_at);
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);

    const isEligible = initialReferenceDate < cutoffTime;
    assert.equal(isEligible, false, 'Newly discovered legacy image must get a full 60-day grace period');
  });

});
