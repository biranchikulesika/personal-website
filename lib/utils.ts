import type { PostSection } from '@/lib/types';

// Text utilities ---------------------------------------------------------------

/** Converts arbitrary text into a clean kebab-case slug. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Validates whether a URL or path is safe to use in links / redirects.
 * Rejects javascript:, data:, vbscript:, and relative protocol (//) exploits.
 */
export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Disallow relative protocol URLs like //evil.com or /\evil.com
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\') || trimmed.startsWith('\\')) {
    return false;
  }

  // Safe relative paths starting with /
  if (trimmed.startsWith('/') && !trimmed.startsWith('/\\')) {
    return true;
  }

  // Safe HTTP/HTTPS protocols
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Sanitizes a redirect path parameter to prevent open redirect vulnerabilities.
 * Returns the sanitized relative path or the fallback path.
 */
export function sanitizeRedirectPath(
  path: string | null | undefined,
  fallback: string = '/admin',
): string {
  if (!path || typeof path !== 'string') return fallback;
  const trimmed = path.trim();

  // Must start with / and not contain protocol or double slashes
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\') || trimmed.includes(':')) {
    return fallback;
  }

  return trimmed;
}

// Date utilities ---------------------------------------------------------------

/**
 * Formats a date string for display. Accepts either an ISO date
 * ("2026-03-12") or a pre-formatted string ("Mar 12, 2026") and always
 * renders the full day-month-year form.
 */
export function formatDisplayDate(value: string): string {
  if (!value) return '';
  const trimmed = value.trim();

  // Already human-readable ("Mar 12, 2026", "2025").
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const date = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(date.getTime())) return trimmed;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Markdown conversion ----------------------------------------------------------

/** Converts post intro paragraphs and sections into an MDX markdown string. */
export function sectionsToMarkdown(
  intro: string[],
  sections: PostSection[],
): string {
  const parts: string[] = [];
  if (intro && intro.length > 0) {
    parts.push(intro.join('\n\n'));
  }
  if (sections && sections.length > 0) {
    sections.forEach((sec) => {
      parts.push(`## ${sec.heading}`);
      if (sec.paragraphs && sec.paragraphs.length > 0) {
        parts.push(sec.paragraphs.join('\n\n'));
      }
      if (sec.figure) {
        parts.push(`![${sec.figure.alt}](${sec.figure.src})\n*${sec.figure.caption}*`);
      }
      if (sec.quote) {
        parts.push(`> ${sec.quote.text}\n> — ${sec.quote.attribution || ''}`);
      }
      if (sec.footnotes && sec.footnotes.length > 0) {
        sec.footnotes.forEach((fn, idx) => {
          parts.push(`[^${idx + 1}]: ${fn}`);
        });
      }
    });
  }
  return parts.join('\n\n');
}

/** Converts MDX markdown back into structured intro paragraphs and PostSections. */
export function markdownToPostSections(
  md: string,
): { intro: string[]; sections: PostSection[] } {
  if (!md || !md.trim()) {
    return { intro: [], sections: [] };
  }

  // Split by H2 headers (## Heading)
  const parts = md.split(/^##\s+/m);
  const introText = parts[0]?.trim() || '';
  const intro = introText ? introText.split('\n\n').filter(Boolean) : [];

  const sections: PostSection[] = [];
  for (let i = 1; i < parts.length; i++) {
    const chunk = parts[i];
    const firstNewline = chunk.indexOf('\n');
    const heading = (firstNewline > -1 ? chunk.slice(0, firstNewline) : chunk).trim();
    const body = firstNewline > -1 ? chunk.slice(firstNewline).trim() : '';

    // Extract footnote definitions: [^1]: text
    const footnotes: string[] = [];
    const bodyLines = body.split('\n');
    const contentLines: string[] = [];
    for (const line of bodyLines) {
      const fnMatch = line.trim().match(/^\[\^(\d+)\]:\s*(.+)/);
      if (fnMatch) {
        footnotes[Number(fnMatch[1]) - 1] = fnMatch[2];
      } else {
        contentLines.push(line);
      }
    }

    const paragraphs = contentLines.join('\n').split('\n\n').filter(Boolean);

    sections.push({
      id: slugify(heading) || `section-${i}`,
      heading: heading || `Section ${i}`,
      paragraphs: paragraphs.length > 0 ? paragraphs : [''],
      ...(footnotes.length > 0 ? { footnotes } : {}),
    });
  }

  return { intro, sections };
}

// Device & User Agent utilities ------------------------------------------------

/**
 * Parses a user-agent string into a clean, human-readable device and browser description.
 * e.g., "Linux Computer / Chrome", "MacBook / Safari", "iPhone / Safari", "Windows PC / Edge".
 */
export function parseUserAgent(ua?: string | null): {
  device: string;
  browser: string;
  label: string;
} {
  if (!ua || typeof ua !== 'string') {
    return {
      device: 'Current Device',
      browser: 'Web Browser',
      label: 'Current Device / Web Browser',
    };
  }

  let device = 'Desktop Computer';
  let browser = 'Web Browser';

  // Device / OS detection
  if (/iPhone/i.test(ua)) {
    device = 'iPhone';
  } else if (/iPad/i.test(ua)) {
    device = 'iPad';
  } else if (/Android/i.test(ua)) {
    device = 'Android Phone';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    device = 'MacBook';
  } else if (/Windows/i.test(ua)) {
    device = 'Windows PC';
  } else if (/Linux/i.test(ua)) {
    device = 'Linux Computer';
  }

  // Browser detection
  if (/Edg\//i.test(ua)) {
    browser = 'Edge';
  } else if (/OPR\/|Opera/i.test(ua)) {
    browser = 'Opera';
  } else if (/Chrome\/|CriOS\//i.test(ua)) {
    browser = 'Chrome';
  } else if (/Firefox\/|FxiOS\//i.test(ua)) {
    browser = 'Firefox';
  } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    browser = 'Safari';
  }

  return {
    device,
    browser,
    label: `${device} / ${browser}`,
  };
}

/**
 * Formats note snippet for listing and homepages.
 * When the content character limit is about to be reached, truncates cleanly
 * at word boundary and ends with "...read now" for a professional feel.
 */
export function formatNoteSnippet(
  content: string | string[] | undefined,
  maxLen = 160,
): string {
  if (!content) return '';
  const fullText = (Array.isArray(content) ? content.join(' ') : content).trim();
  if (!fullText) return '';
  if (fullText.length <= maxLen) return fullText;

  const truncated = fullText.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  const cleanSnippet = lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
  return `${cleanSnippet}...read now`;
}