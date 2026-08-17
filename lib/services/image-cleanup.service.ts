import { getSupabaseAdmin } from '../supabase/server';

export interface ImageReference {
  bucket: string;
  path: string;
}

export interface CleanupResult {
  success: boolean;
  dryRun: boolean;
  retentionDays: number;
  scannedCount: number;
  referencedCount: number;
  orphanedCount: number;
  deletedCount: number;
  skippedCount: number;
  failedCount: number;
  deletedPaths: string[];
  errors: string[];
  durationMs: number;
  executedAt: string;
}

export interface ImageCleanupOptions {
  dryRun?: boolean;
  retentionDays?: number;
  buckets?: string[];
  maxDeletionsPerRun?: number;
}

const DEFAULT_BUCKETS = [
  'post-images',
  'media',
  'cover-images',
  'persona-assets',
  'profile-assets',
  'newsletter-assets',
];

/**
 * Normalizes an arbitrary image URL or path into a bucket and storage path.
 */
export function normalizeImagePath(rawUrlOrPath: string, defaultBucket = 'post-images'): ImageReference | null {
  if (!rawUrlOrPath || typeof rawUrlOrPath !== 'string') return null;

  const cleaned = rawUrlOrPath.trim();
  if (!cleaned || cleaned === 'null' || cleaned === 'undefined') return null;

  // Pattern 1: Supabase Storage Public / Authenticated URL
  // e.g. https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
  const supabaseStorageRegex = /\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(?:\?.*)?$/i;
  const supabaseMatch = cleaned.match(supabaseStorageRegex);
  if (supabaseMatch) {
    const bucket = decodeURIComponent(supabaseMatch[1]);
    const path = decodeURIComponent(supabaseMatch[2]);
    return { bucket, path };
  }

  // Pattern 2: Next.js Image optimizer wrapper
  // e.g. /_next/image?url=...
  if (cleaned.includes('/_next/image')) {
    try {
      const urlObj = new URL(cleaned, 'http://localhost');
      const nestedUrl = urlObj.searchParams.get('url');
      if (nestedUrl) {
        return normalizeImagePath(nestedUrl, defaultBucket);
      }
    } catch {
      // ignore url parse error
    }
  }

  // Pattern 3: Custom domain or relative path prefixed with bucket name
  // e.g. /post-images/2026/08/18/uuid.webp or post-images/2026/08/18/uuid.webp
  for (const bucket of DEFAULT_BUCKETS) {
    const bucketPrefixRegex = new RegExp(`^/?${bucket}/(.+)$`, 'i');
    const prefixMatch = cleaned.match(bucketPrefixRegex);
    if (prefixMatch) {
      return { bucket, path: decodeURIComponent(prefixMatch[1]) };
    }
  }

  // Pattern 4: External non-Supabase URLs (e.g. unsplash, cloudinary, github)
  if (/^https?:\/\//i.test(cleaned) && !cleaned.includes('supabase.co')) {
    return null;
  }

  // Pattern 5: Bare relative storage path (e.g. 2026/08/18/uuid.webp or uuid.jpg)
  // Strip any leading slashes or query parameters
  const sanitizedPath = cleaned.replace(/^\/+/, '').split('?')[0];
  if (sanitizedPath.length > 0 && !sanitizedPath.startsWith('http')) {
    return { bucket: defaultBucket, path: sanitizedPath };
  }

  return null;
}

/**
 * Extracts all image paths and URLs from text content (MDX, HTML, Markdown, JSX).
 */
export function extractImageReferencesFromText(text: string | null | undefined, defaultBucket = 'post-images'): ImageReference[] {
  if (!text || typeof text !== 'string') return [];

  const refsMap = new Map<string, ImageReference>();
  const addRef = (urlOrPath: string) => {
    const ref = normalizeImagePath(urlOrPath, defaultBucket);
    if (ref) {
      refsMap.set(`${ref.bucket}:${ref.path}`, ref);
    }
  };

  // 1. Markdown images: ![alt](url)
  const mdRegex = /!\[.*?\]\((.*?)\)/g;
  let match: RegExpExecArray | null;
  while ((match = mdRegex.exec(text)) !== null) {
    if (match[1]) addRef(match[1]);
  }

  // 2. HTML <img> tags: <img ... src="..." ... />
  const htmlImgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  while ((match = htmlImgRegex.exec(text)) !== null) {
    if (match[1]) addRef(match[1]);
  }

  // 3. JSX <Image path="..." /> and <Image src="..." />
  const jsxImagePathRegex = /<Image[^>]+path=["']([^"']+)["']/gi;
  while ((match = jsxImagePathRegex.exec(text)) !== null) {
    if (match[1]) addRef(match[1]);
  }

  const jsxImageSrcRegex = /<Image[^>]+src=["']([^"']+)["']/gi;
  while ((match = jsxImageSrcRegex.exec(text)) !== null) {
    if (match[1]) addRef(match[1]);
  }

  // 4. Custom <ImageBlock src="..." />
  const imageBlockRegex = /<ImageBlock[^>]+src=["']([^"']+)["']/gi;
  while ((match = imageBlockRegex.exec(text)) !== null) {
    if (match[1]) addRef(match[1]);
  }

  // 5. CSS url(...) references
  const cssUrlRegex = /url\(["']?([^"')]+)["']?\)/gi;
  while ((match = cssUrlRegex.exec(text)) !== null) {
    if (match[1]) addRef(match[1]);
  }

  // 6. Direct Supabase Storage URLs embedded in raw text or JSON
  const rawSupabaseUrlRegex = /https:\/\/[^"'\s)]+supabase\.co\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/([^"'\s)]+)/gi;
  while ((match = rawSupabaseUrlRegex.exec(text)) !== null) {
    if (match[1] && match[2]) {
      const b = decodeURIComponent(match[1]);
      const p = decodeURIComponent(match[2].split('?')[0]);
      refsMap.set(`${b}:${p}`, { bucket: b, path: p });
    }
  }

  return Array.from(refsMap.values());
}

export class ImageCleanupService {
  private retentionDays: number;

  constructor(customRetentionDays?: number) {
    const envDays = parseInt(process.env.ORPHAN_IMAGE_RETENTION_DAYS || '60', 10);
    this.retentionDays = customRetentionDays !== undefined ? customRetentionDays : (isNaN(envDays) ? 60 : envDays);
  }

  /**
   * Scans all database tables to identify all currently referenced image paths.
   */
  async scanAllReferencedImages(): Promise<Map<string, { count: number; locations: string[] }>> {
    const supabase = getSupabaseAdmin();
    const referencedMap = new Map<string, { count: number; locations: string[] }>();

    const recordRef = (ref: ImageReference | null, location: string) => {
      if (!ref) return;
      const key = `${ref.bucket}:${ref.path}`;
      const existing = referencedMap.get(key) || { count: 0, locations: [] };
      existing.count += 1;
      if (!existing.locations.includes(location)) {
        existing.locations.push(location);
      }
      referencedMap.set(key, existing);
    };

    // 1. Scan Posts (both published and draft, content and draft_content, cover images)
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, slug, status, cover_image_url, content, draft_content');

    if (postsError) {
      console.error('Error scanning posts for image references:', postsError);
      throw new Error(`Failed to scan posts: ${postsError.message}`);
    }

    if (posts) {
      for (const post of posts) {
        const postLabel = `post:${post.slug || post.id} (${post.status || 'draft'})`;
        if (post.cover_image_url) {
          recordRef(normalizeImagePath(post.cover_image_url, 'post-images'), `${postLabel}:cover`);
        }
        if (post.content) {
          const refs = extractImageReferencesFromText(post.content, 'post-images');
          for (const ref of refs) recordRef(ref, `${postLabel}:content`);
        }
        if (post.draft_content) {
          const refs = extractImageReferencesFromText(post.draft_content, 'post-images');
          for (const ref of refs) recordRef(ref, `${postLabel}:draft_content`);
        }
      }
    }

    // 2. Scan Books
    const { data: books } = await supabase.from('books').select('id, title, coverImage');
    if (books) {
      for (const book of books) {
        if (book.coverImage) {
          recordRef(normalizeImagePath(book.coverImage, 'media'), `book:${book.id}:cover`);
        }
      }
    }

    // 3. Scan Redistribution Records
    const { data: redistRecords } = await supabase.from('redistribution_records').select('id, proofUrl');
    if (redistRecords) {
      for (const record of redistRecords) {
        if (record.proofUrl) {
          recordRef(normalizeImagePath(record.proofUrl, 'media'), `redistribution:${record.id}:proof`);
        }
      }
    }

    // 4. Scan Field Notes, Fragments, Thought Fragments, Journal Moments
    const { data: fieldNotes } = await supabase.from('field_notes').select('id, content');
    if (fieldNotes) {
      for (const note of fieldNotes) {
        const refs = extractImageReferencesFromText(note.content, 'media');
        for (const ref of refs) recordRef(ref, `field_note:${note.id}`);
      }
    }

    const { data: thoughtFragments } = await supabase.from('thought_fragments').select('id, content');
    if (thoughtFragments) {
      for (const tf of thoughtFragments) {
        const refs = extractImageReferencesFromText(tf.content, 'media');
        for (const ref of refs) recordRef(ref, `thought_fragment:${tf.id}`);
      }
    }

    const { data: fragments } = await supabase.from('fragments').select('id, body, quote');
    if (fragments) {
      for (const fragment of fragments) {
        if (fragment.body) {
          const refs = extractImageReferencesFromText(fragment.body, 'media');
          for (const ref of refs) recordRef(ref, `fragment:${fragment.id}:body`);
        }
        if (fragment.quote) {
          const refs = extractImageReferencesFromText(fragment.quote, 'media');
          for (const ref of refs) recordRef(ref, `fragment:${fragment.id}:quote`);
        }
      }
    }

    const { data: journalMoments } = await supabase.from('journal_moments').select('id, content');
    if (journalMoments) {
      for (const jm of journalMoments) {
        const refs = extractImageReferencesFromText(jm.content, 'media');
        for (const ref of refs) recordRef(ref, `journal_moment:${jm.id}`);
      }
    }

    // 5. Scan Newsletter Profiles and Issues
    const { data: nlProfiles } = await supabase.from('newsletter_profiles').select('id, description, philosophyText');
    if (nlProfiles) {
      for (const nlp of nlProfiles) {
        if (nlp.description) {
          const refs = extractImageReferencesFromText(nlp.description, 'persona-assets');
          for (const ref of refs) recordRef(ref, `newsletter_profile:${nlp.id}:description`);
        }
      }
    }

    const { data: nlIssues } = await supabase.from('newsletter_issues').select('id, content');
    if (nlIssues) {
      for (const issue of nlIssues) {
        const refs = extractImageReferencesFromText(issue.content, 'newsletter-assets');
        for (const ref of refs) recordRef(ref, `newsletter_issue:${issue.id}`);
      }
    }

    return referencedMap;
  }

  /**
   * Lists all files from a Supabase Storage bucket with pagination.
   */
  async listAllStorageFiles(bucket: string): Promise<Array<{ name: string; created_at: string; id?: string; metadata?: any }>> {
    const supabase = getSupabaseAdmin();
    const allFiles: Array<{ name: string; created_at: string; id?: string; metadata?: any }> = [];

    const fetchFolder = async (folderPath: string) => {
      let offset = 0;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase.storage.from(bucket).list(folderPath, {
          limit,
          offset,
          sortBy: { column: 'created_at', order: 'desc' },
        });

        if (error) {
          console.warn(`Warning: Could not list storage bucket "${bucket}" at path "${folderPath}":`, error.message);
          break;
        }

        if (!data || data.length === 0) {
          hasMore = false;
          break;
        }

        for (const item of data) {
          if (item.name === '.emptyFolderPlaceholder') continue;

          // If item is a folder (id is null or metadata is null/empty), recursively fetch contents
          if (!item.id && !item.metadata) {
            const nestedPath = folderPath ? `${folderPath}/${item.name}` : item.name;
            await fetchFolder(nestedPath);
          } else {
            const fullPath = folderPath ? `${folderPath}/${item.name}` : item.name;
            allFiles.push({
              name: fullPath,
              created_at: item.created_at || new Date().toISOString(),
              id: item.id,
              metadata: item.metadata,
            });
          }
        }

        offset += limit;
        if (data.length < limit) {
          hasMore = false;
        }
      }
    };

    await fetchFolder('');
    return allFiles;
  }

  /**
   * Synchronizes database tracking records with Supabase Storage.
   */
  async syncStorageToRegistry(bucket: string, storageFiles: Array<{ name: string; created_at: string; metadata?: any }>): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (storageFiles.length === 0) return;

    for (const file of storageFiles) {
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(file.name);
      const createdAt = file.created_at || new Date().toISOString();

      await supabase.from('uploaded_images').upsert(
        {
          bucket,
          storage_path: file.name,
          public_url: publicUrl,
          file_name: file.name.split('/').pop() || file.name,
          size_bytes: file.metadata?.size || null,
          content_type: file.metadata?.mimetype || null,
          first_uploaded_at: createdAt,
          last_referenced_at: createdAt,
          status: 'active',
          last_scanned_at: new Date().toISOString(),
        },
        { onConflict: 'bucket,storage_path', ignoreDuplicates: true }
      );
    }
  }

  /**
   * Registers a newly uploaded image immediately into the registry.
   */
  static async registerUpload(bucket: string, storagePath: string, publicUrl: string, metadata?: { fileName?: string; sizeBytes?: number; contentType?: string }): Promise<void> {
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from('uploaded_images').upsert(
        {
          bucket,
          storage_path: storagePath,
          public_url: publicUrl,
          file_name: metadata?.fileName || storagePath.split('/').pop() || storagePath,
          size_bytes: metadata?.sizeBytes || null,
          content_type: metadata?.contentType || null,
          first_uploaded_at: new Date().toISOString(),
          last_referenced_at: new Date().toISOString(),
          reference_count: 0,
          status: 'active',
          last_scanned_at: new Date().toISOString(),
        },
        { onConflict: 'bucket,storage_path' }
      );
    } catch (err) {
      console.warn('Failed to register image upload in registry:', err);
    }
  }

  /**
   * Main cleanup execution method.
   */
  async runCleanup(options?: ImageCleanupOptions): Promise<CleanupResult> {
    const startTime = Date.now();
    const dryRun = options?.dryRun ?? false;
    const retentionDays = options?.retentionDays ?? this.retentionDays;
    const targetBuckets = options?.buckets ?? DEFAULT_BUCKETS;
    const maxDeletions = options?.maxDeletionsPerRun ?? 200;

    const supabase = getSupabaseAdmin();
    const errors: string[] = [];
    const deletedPaths: string[] = [];

    let scannedCount = 0;
    let referencedCount = 0;
    let orphanedCount = 0;
    let deletedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    try {
      // Step 1: Scan all active references across published/draft posts and all other content tables
      const referencedMap = await this.scanAllReferencedImages();

      // Step 2: For each target bucket, list files and sync to uploaded_images registry
      for (const bucket of targetBuckets) {
        try {
          const storageFiles = await this.listAllStorageFiles(bucket);
          scannedCount += storageFiles.length;
          await this.syncStorageToRegistry(bucket, storageFiles);
        } catch (bucketErr: any) {
          const msg = `Error scanning bucket "${bucket}": ${bucketErr.message}`;
          console.error(msg);
          errors.push(msg);
        }
      }

      // Step 3: Fetch all tracked images from database
      const { data: dbImages, error: dbError } = await supabase
        .from('uploaded_images')
        .select('*')
        .in('bucket', targetBuckets)
        .neq('status', 'deleted');

      if (dbError) {
        throw new Error(`Failed to load registry from database: ${dbError.message}`);
      }

      const now = new Date();
      const cutoffTime = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);

      const imagesToDelete: Array<{ id: string; bucket: string; storage_path: string; ageDays: number }> = [];

      for (const img of (dbImages || [])) {
        const key = `${img.bucket}:${img.storage_path}`;
        const refInfo = referencedMap.get(key);

        if (refInfo && refInfo.count > 0) {
          // Image is actively referenced anywhere in the app
          referencedCount++;
          await supabase
            .from('uploaded_images')
            .update({
              reference_count: refInfo.count,
              status: 'active',
              last_referenced_at: now.toISOString(),
              last_scanned_at: now.toISOString(),
            })
            .eq('id', img.id);
        } else {
          // Image is currently unreferenced
          orphanedCount++;
          const lastRefDate = new Date(img.last_referenced_at || img.first_uploaded_at || img.created_at);
          const ageDays = (now.getTime() - lastRefDate.getTime()) / (1000 * 60 * 60 * 24);

          // Update status in registry
          await supabase
            .from('uploaded_images')
            .update({
              reference_count: 0,
              status: 'orphaned',
              last_scanned_at: now.toISOString(),
            })
            .eq('id', img.id);

          // Safety buffer check: must be unreferenced for MORE than retentionDays (e.g. > 60 days)
          if (lastRefDate < cutoffTime) {
            imagesToDelete.push({
              id: img.id,
              bucket: img.bucket,
              storage_path: img.storage_path,
              ageDays: Math.round(ageDays),
            });
          } else {
            // Still in grace period (< 60 days)
            skippedCount++;
          }
        }
      }

      // Step 4: Deletion process
      for (const candidate of imagesToDelete) {
        if (deletedCount >= maxDeletions) {
          skippedCount += (imagesToDelete.length - deletedCount);
          break;
        }

        const candidateKey = `${candidate.bucket}:${candidate.storage_path}`;

        // Double check against real-time references right before deleting (race condition guard)
        if (referencedMap.has(candidateKey)) {
          skippedCount++;
          continue;
        }

        if (dryRun) {
          deletedCount++;
          deletedPaths.push(`${candidate.bucket}/${candidate.storage_path}`);
          continue;
        }

        try {
          // 1. Delete physical file from Supabase Storage
          const { error: storageRemoveErr } = await supabase.storage
            .from(candidate.bucket)
            .remove([candidate.storage_path]);

          if (storageRemoveErr) {
            failedCount++;
            const errMsg = `Storage deletion failed for ${candidateKey}: ${storageRemoveErr.message}`;
            console.error(errMsg);
            errors.push(errMsg);
            // CRITICAL SAFETY: If storage deletion fails, DO NOT delete DB record!
            continue;
          }

          // 2. Remove / mark deleted in database registry
          const { error: dbDeleteErr } = await supabase
            .from('uploaded_images')
            .delete()
            .eq('id', candidate.id);

          if (dbDeleteErr) {
            // Fallback: mark status as deleted
            await supabase
              .from('uploaded_images')
              .update({ status: 'deleted', reference_count: 0 })
              .eq('id', candidate.id);
          }

          deletedCount++;
          deletedPaths.push(`${candidate.bucket}/${candidate.storage_path}`);
        } catch (delErr: any) {
          failedCount++;
          const errMsg = `Deletion error for ${candidateKey}: ${delErr.message}`;
          console.error(errMsg);
          errors.push(errMsg);
        }
      }

      const durationMs = Date.now() - startTime;
      const finalStatus = errors.length === 0 ? 'success' : (deletedCount > 0 ? 'partial' : 'failed');

      // Record audit log entry in image_cleanup_logs
      await supabase.from('image_cleanup_logs').insert({
        scanned_count: scannedCount,
        referenced_count: referencedCount,
        orphaned_count: orphanedCount,
        deleted_count: deletedCount,
        skipped_count: skippedCount,
        failed_count: failedCount,
        retention_days: retentionDays,
        deleted_paths: deletedPaths,
        errors: errors,
        details: {
          dryRun,
          buckets: targetBuckets,
          maxDeletions,
        },
        duration_ms: durationMs,
        status: finalStatus,
        executed_at: now.toISOString(),
      });

      return {
        success: errors.length === 0,
        dryRun,
        retentionDays,
        scannedCount,
        referencedCount,
        orphanedCount,
        deletedCount,
        skippedCount,
        failedCount,
        deletedPaths,
        errors,
        durationMs,
        executedAt: now.toISOString(),
      };
    } catch (fatalErr: any) {
      console.error('Fatal error during image cleanup run:', fatalErr);
      const durationMs = Date.now() - startTime;
      errors.push(fatalErr.message || 'Fatal error during image cleanup');

      try {
        await supabase.from('image_cleanup_logs').insert({
          scanned_count: scannedCount,
          referenced_count: referencedCount,
          orphaned_count: orphanedCount,
          deleted_count: deletedCount,
          skipped_count: skippedCount,
          failed_count: failedCount,
          retention_days: retentionDays,
          deleted_paths: deletedPaths,
          errors: errors,
          details: { error: fatalErr.message, stack: fatalErr.stack },
          duration_ms: durationMs,
          status: 'failed',
          executed_at: new Date().toISOString(),
        });
      } catch {
        // Ignore secondary log failure
      }

      return {
        success: false,
        dryRun,
        retentionDays,
        scannedCount,
        referencedCount,
        orphanedCount,
        deletedCount,
        skippedCount,
        failedCount,
        deletedPaths,
        errors,
        durationMs,
        executedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Retrieves the most recent cleanup audit logs.
   */
  static async getRecentLogs(limit = 10): Promise<any[]> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('image_cleanup_logs')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching cleanup logs:', err);
      return [];
    }
  }

  /**
   * Retrieves high-level storage health summary.
   */
  static async getStorageHealthSummary(): Promise<{
    totalTracked: number;
    activeCount: number;
    orphanedInGracePeriod: number;
    eligibleForCleanup: number;
    lastCleanupLog: any | null;
    retentionDays: number;
  }> {
    const supabase = getSupabaseAdmin();
    const envDays = parseInt(process.env.ORPHAN_IMAGE_RETENTION_DAYS || '60', 10);
    const retentionDays = isNaN(envDays) ? 60 : envDays;
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

    const { data: allImages } = await supabase
      .from('uploaded_images')
      .select('id, status, last_referenced_at, first_uploaded_at')
      .neq('status', 'deleted');

    let totalTracked = 0;
    let activeCount = 0;
    let orphanedInGracePeriod = 0;
    let eligibleForCleanup = 0;

    if (allImages) {
      totalTracked = allImages.length;
      for (const img of allImages) {
        if (img.status === 'active') {
          activeCount++;
        } else {
          const lastRef = img.last_referenced_at || img.first_uploaded_at;
          if (lastRef && lastRef < cutoffDate) {
            eligibleForCleanup++;
          } else {
            orphanedInGracePeriod++;
          }
        }
      }
    }

    const logs = await ImageCleanupService.getRecentLogs(1);
    const lastCleanupLog = logs.length > 0 ? logs[0] : null;

    return {
      totalTracked,
      activeCount,
      orphanedInGracePeriod,
      eligibleForCleanup,
      lastCleanupLog,
      retentionDays,
    };
  }
}
