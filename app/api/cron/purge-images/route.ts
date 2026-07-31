import { NextResponse } from 'next/server';
import { PostService } from '@/lib/services/post.service';
import { supabaseClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const postService = new PostService();
    const posts = await postService.getAll();

    const usedImagePaths = new Set<string>();

    const extractPathFromUrl = (url: string) => {
      const parts = url.split('/post-images/');
      if (parts.length > 1) {
        return parts[1];
      }
      return url;
    };

    posts.forEach(post => {
      if (post.coverImageUrl) {
        usedImagePaths.add(extractPathFromUrl(post.coverImageUrl));
      }
      if (post.content) {
        const mdImageRegex = /!\[.*?\]\((.*?)\)/g;
        let match;
        while ((match = mdImageRegex.exec(post.content)) !== null) {
          usedImagePaths.add(extractPathFromUrl(match[1]));
        }

        const jsxImageRegex = /src="([^"]*)"/g;
        while ((match = jsxImageRegex.exec(post.content)) !== null) {
          usedImagePaths.add(extractPathFromUrl(match[1]));
        }

        const htmlImageRegex = /<img[^>]+src="([^">]+)"/g;
        while ((match = htmlImageRegex.exec(post.content)) !== null) {
          usedImagePaths.add(extractPathFromUrl(match[1]));
        }
      }
    });

    let allFiles: any[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabaseClient.storage
        .from('post-images')
        .list('', { limit, offset });

      if (error) {
        throw new Error('Failed to list storage: ' + error.message);
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allFiles = allFiles.concat(data);
        offset += limit;
        if (data.length < limit) {
          hasMore = false;
        }
      }
    }

    const filesToDelete: string[] = [];

    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

    allFiles.forEach(file => {
      if (file.name === '.emptyFolderPlaceholder') return;

      const fileCreatedAt = new Date(file.created_at);
      if (fileCreatedAt < twoHoursAgo) {
        if (!usedImagePaths.has(file.name)) {
          filesToDelete.push(file.name);
        }
      }
    });

    const results = {
      totalFiles: allFiles.length,
      usedPathsFound: usedImagePaths.size,
      oldUnusedFilesToDelete: filesToDelete.length,
      deleted: false,
      errors: [] as string[]
    };

    if (filesToDelete.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < filesToDelete.length; i += batchSize) {
        const batch = filesToDelete.slice(i, i + batchSize);
        const { error } = await supabaseClient.storage.from('post-images').remove(batch);
        if (error) {
          results.errors.push(error.message);
        }
      }
      results.deleted = results.errors.length === 0;
    }

    return NextResponse.json(results);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
