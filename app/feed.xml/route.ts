import { getPosts } from '@/lib/queries';
import { SITE_URL, SITE_NAME, AUTHOR } from '@/lib/config/seo';

export const dynamic = 'force-dynamic';

const MAX_ITEMS = 20;
const VALID_SUBDOMAINS = ['builder', 'thinker', 'wanderer', 'operator'] as const;

/**
 * RSS 2.0 feed served at /feed.xml.
 * Lists the 20 most recent published posts across all personas.
 * Includes full post content in <content:encoded> for feed readers.
 *
 * Feed readers and services (Feedly, RSS.app, etc.) will automatically
 * discover this when users subscribe to the site.
 */
export async function GET() {
  const siteUrl = SITE_URL;
  const language = 'en';
  const selfLink = `${siteUrl}/feed.xml`;

  let itemsXml = '';

  try {
    const posts = await getPosts();
    const publishedPosts = posts
      .filter(
        (p: any) =>
          p.status !== 'draft' &&
          (!p.status || p.status.toLowerCase() !== 'draft') &&
          p.hidden !== true &&
          p.publishedAt,
      )
      .sort(
        (a: any, b: any) =>
          new Date(b.publishedAt || b.createdAt || 0).getTime() -
          new Date(a.publishedAt || a.createdAt || 0).getTime(),
      )
      .slice(0, MAX_ITEMS);

    itemsXml = publishedPosts
      .map((post: any) => {
        const slug = post.slug || post.id;
        const postDate = post.publishedAt || post.createdAt;

        let postUrl: string;
        if (post.persona && VALID_SUBDOMAINS.includes(post.persona as any)) {
          postUrl = siteUrl.replace('://', `://${post.persona}.`) + `/p/${slug}`;
        } else {
          postUrl = `${siteUrl}/p/${slug}`;
        }

        const categoryTags = Array.isArray(post.tags) ? post.tags : [];
        const description = post.excerpt || post.subtitle || '';
        const contentHtml = renderContentForRss(post.content, post.title);

        return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${escapeXml(postUrl)}</link>
      <guid isPermaLink="true">${escapeXml(postUrl)}</guid>
      <description><![CDATA[${escapeCdata(description)}]]></description>
      <content:encoded><![CDATA[${escapeCdata(contentHtml)}]]></content:encoded>
      <pubDate>${new Date(postDate).toUTCString()}</pubDate>
      <author>${escapeXml(AUTHOR.name)}</author>
      ${categoryTags.map((tag: string) => `      <category>${escapeXml(tag)}</category>`).join('\n')}
    </item>`;
      })
      .join('');
  } catch (error) {
    console.error('RSS feed: Failed to fetch posts', error);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title><![CDATA[${SITE_NAME}]]></title>
    <link>${escapeXml(siteUrl)}</link>
    <description><![CDATA[Personal digital garden and portfolio of Biranchi Kulesika, featuring the Builder, Operator, Thinker, and Wanderer personas.]]></description>
    <language>${language}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>60</ttl>
    <atom:link href="${escapeXml(selfLink)}" rel="self" type="application/rss+xml"/>
    <image>
      <url>${escapeXml(siteUrl)}/images/biranchi.png</url>
      <title>${SITE_NAME}</title>
      <link>${escapeXml(siteUrl)}</link>
      <width>144</width>
      <height>144</height>
    </image>
    ${itemsXml || '    <!-- No posts published yet -->'}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

/**
 * Converts a post's content field to HTML suitable for <content:encoded>.
 * Handles all content formats used by the app:
 * - HTML (TiP tap / rich text editor) → pass through
 * - JSON block array (composer blocks) → render each block as HTML
 * - Plain text / Markdown → wrap in basic HTML with paragraph breaks
 */
function renderContentForRss(content: string | undefined | null, postTitle: string): string {
  if (!content) return `<p>${postTitle}</p>`;

  const trimmed = content.trim();
  if (!trimmed) return `<p>${postTitle}</p>`;

  // 1. Already HTML — detect by looking for HTML tags
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return trimmed;
  }

  // 2. JSON block array (composer blocks) — try to parse
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return renderBlocksAsHtml(parsed);
    }
  } catch {
    // Not JSON, continue to markdown/plain text
  }

  // 3. Markdown or plain text — convert basic patterns to HTML
  return renderMarkdownAsHtml(trimmed);
}


/** Renders composer block arrays into basic HTML for the RSS feed. */
function renderBlocksAsHtml(blocks: any[]): string {
  return blocks
    .map((block) => {
      const text = block.text || block.content || '';

      switch (block.type) {
        case 'heading':
        case 'h2': {
          const level = block.level || 2;
          return `<h${level}>${text}</h${level}>`;
        }
        case 'h3':
          return `<h3>${text}</h3>`;
        case 'blockquote':
        case 'quote':
          return `<blockquote><p>${text}</p></blockquote>`;
        case 'code':
          return `<pre><code>${text}</code></pre>`;
        case 'image':
          return block.src || block.url
            ? `<figure><img src="${block.src || block.url}" alt="${block.alt || ''}" />${block.caption ? `<figcaption>${block.caption}</figcaption>` : ''}</figure>`
            : '';
        case 'list':
        case 'ul': {
          const items = block.items || [text];
          return `<ul>${items.map((item: string) => `<li>${item}</li>`).join('')}</ul>`;
        }
        case 'paragraph':
        case 'text':
        default:
          return text ? `<p>${text}</p>` : '';
      }
    })
    .filter(Boolean)
    .join('\n');
}

/** Converts basic markdown patterns to HTML for RSS feed readers. */
function renderMarkdownAsHtml(markdown: string): string {
  const lines = markdown.split('\n');
  const htmlParts: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line — end current list or paragraph
    if (!trimmed) {
      if (inList) {
        htmlParts.push('</ul>');
        inList = false;
      }
      continue;
    }

    // Heading
    if (/^#{1,6}\s/.test(trimmed)) {
      if (inList) {
        htmlParts.push('</ul>');
        inList = false;
      }
      const level = trimmed.match(/^#+/)![0].length;
      const text = trimmed.replace(/^#+\s*/, '');
      htmlParts.push(`<h${level}>${text}</h${level}>`);
      continue;
    }

    // List item
    if (/^[-*+]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
      if (!inList) {
        htmlParts.push('<ul>');
        inList = true;
      }
      const text = trimmed.replace(/^[-*+]\s/, '').replace(/^\d+\.\s/, '');
      htmlParts.push(`<li>${inlineMarkdownToHtml(text)}</li>`);
      continue;
    }

    // Blockquote
    if (/^>\s/.test(trimmed)) {
      if (inList) {
        htmlParts.push('</ul>');
        inList = false;
      }
      const text = trimmed.replace(/^>\s*/, '');
      htmlParts.push(`<blockquote><p>${inlineMarkdownToHtml(text)}</p></blockquote>`);
      continue;
    }

    // Thematic break
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      if (inList) {
        htmlParts.push('</ul>');
        inList = false;
      }
      htmlParts.push('<hr />');
      continue;
    }

    // Regular paragraph
    if (inList) {
      htmlParts.push('</ul>');
      inList = false;
    }
    htmlParts.push(`<p>${inlineMarkdownToHtml(trimmed)}</p>`);
  }

  if (inList) {
    htmlParts.push('</ul>');
  }

  return htmlParts.join('\n');
}

/** Converts inline markdown patterns (bold, italic, code, links) to HTML. */
function inlineMarkdownToHtml(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeCdata(str: string): string {
  return str.replace(/]]>/g, ']]&gt;');
}
