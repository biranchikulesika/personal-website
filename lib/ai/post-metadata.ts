/**
 * Background-First AI Content Optimization System
 * Analyzes article content asynchronously to generate and maintain:
 * - SEO Title & Meta Description
 * - Excerpt / Summary
 * - URL Slug Suggestion
 * - Open Graph & Twitter Titles and Descriptions
 * - Tags, Keywords & Category Suggestions
 * - Image Alt Text
 *
 * Implements intelligent debouncing, content hashing, and respectful manual override preservation.
 */

import { slugify } from '@/lib/utils';

export interface CompletePostMetadata {
  seoTitle: string;
  seoDescription: string;
  excerpt: string;
  suggestedSlug: string;
  ogTitle: string;
  ogDescription: string;
  twitterTitle: string;
  twitterDescription: string;
  tags: string[];
  keywords: string[];
  suggestedCategory: string;
  coverImageAlt?: string;
  contentHash: string;
}

export interface PostMetadataInput {
  title: string;
  content: string;
  persona?: string;
  coverImageUrl?: string;
  manualOverrides?: string[];
  existingData?: Partial<CompletePostMetadata>;
}

export interface PostMetadataOutput {
  excerpt: string;
  tags: string[];
}

/**
 * Strips MDX and HTML tags to produce clean body text for analysis
 */
export function cleanContentText(content: string): string {
  if (!content) return '';
  return content
    // Remove custom MDX components <Component ... /> or <Component>...</Component>
    .replace(/<[A-Z][A-Za-z0-9]*\b[^>]*\/>/g, ' ')
    .replace(/<[A-Z][A-Za-z0-9]*\b[^>]*>[\s\S]*?<\/[A-Z][A-Za-z0-9]*>/g, ' ')
    // Remove HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove markdown code blocks ```...```
    .replace(/```[\s\S]*?```/g, ' ')
    // Remove markdown inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown headings, bold, italic, quotes
    .replace(/^[#\s=->]+/gm, '')
    .replace(/[*_~]+/g, '')
    // Normalize spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fast content fingerprint hash to avoid redundant AI regeneration
 */
export function computeContentHash(title: string, content: string, persona: string = '', coverImageUrl: string = ''): string {
  const clean = cleanContentText(content);
  const inputStr = `${title.trim()}|${persona.trim()}|${coverImageUrl.trim()}|${clean.length}|${clean.slice(0, 1500)}`;
  
  let hash = 0;
  for (let i = 0; i < inputStr.length; i++) {
    const char = inputStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `h_${Math.abs(hash).toString(36)}_${clean.length}`;
}

/**
 * Heuristic fallback: generates rich metadata locally without requiring network or AI API
 */
export function generateHeuristicMetadata(
  title: string,
  content: string,
  persona: string = 'builder',
  coverImageUrl: string = ''
): CompletePostMetadata {
  const cleanText = cleanContentText(content);
  const cleanTitle = (title || 'Untitled Post').trim();

  // Excerpt
  let excerpt = '';
  if (!cleanText || cleanText.length < 20) {
    excerpt = `An exploration into ${cleanTitle.toLowerCase()} by Biranchi Kulesika.`;
  } else {
    const sentenceMatch = cleanText.match(/^([^.!?]+[.!?]\s*[^.!?]+[.!?])/);
    if (sentenceMatch && sentenceMatch[1] && sentenceMatch[1].length <= 260) {
      excerpt = sentenceMatch[1].trim();
    } else {
      const firstSentence = cleanText.split(/[.!?]/)[0];
      if (firstSentence && firstSentence.length >= 30 && firstSentence.length <= 220) {
        excerpt = firstSentence.trim() + '.';
      } else if (cleanText.length > 180) {
        excerpt = cleanText.slice(0, 180).replace(/\s+\S*$/, '') + '...';
      } else {
        excerpt = cleanText;
      }
    }
  }

  // Tags
  const personaDefaultTags: Record<string, string[]> = {
    builder: ['systems', 'engineering', 'architecture', 'software'],
    thinker: ['philosophy', 'essays', 'inquiry', 'mindset'],
    operator: ['operations', 'security', 'tactics', 'execution'],
    wanderer: ['field-notes', 'travel', 'observations', 'culture'],
  };
  const defaults = personaDefaultTags[persona.toLowerCase()] || ['writing', 'essays', 'thoughts'];
  const textWords = `${cleanTitle} ${cleanText}`.toLowerCase().split(/[^a-z0-9-]+/).filter(w => w.length > 3);
  
  const commonKeywords: Record<string, string> = {
    javascript: 'javascript', typescript: 'typescript', react: 'react', nextjs: 'nextjs',
    design: 'design', database: 'database', security: 'security', performance: 'performance',
    automation: 'automation', ai: 'ai', architecture: 'architecture', systems: 'systems',
    privacy: 'privacy', productivity: 'productivity', strategy: 'strategy', notes: 'notes',
    infrastructure: 'infrastructure', scalability: 'scalability', cloud: 'cloud'
  };

  const matched = new Set<string>();
  for (const word of textWords) {
    if (commonKeywords[word]) {
      matched.add(commonKeywords[word]);
      if (matched.size >= 4) break;
    }
  }
  for (const tag of defaults) {
    if (matched.size >= 4) break;
    matched.add(tag);
  }

  const tags = Array.from(matched);
  const keywords = Array.from(new Set([...tags, ...textWords.slice(0, 8)]));
  const suggestedSlug = slugify(cleanTitle) || 'untitled-post';
  const seoTitle = cleanTitle.length > 55 ? cleanTitle.slice(0, 55).replace(/\s+\S*$/, '') : cleanTitle;
  const seoDescription = excerpt.length > 155 ? excerpt.slice(0, 155).replace(/\s+\S*$/, '') + '...' : excerpt;
  const contentHash = computeContentHash(title, content, persona, coverImageUrl);

  return {
    seoTitle,
    seoDescription,
    excerpt,
    suggestedSlug,
    ogTitle: cleanTitle,
    ogDescription: seoDescription,
    twitterTitle: cleanTitle,
    twitterDescription: seoDescription,
    tags,
    keywords: keywords.slice(0, 8),
    suggestedCategory: persona,
    coverImageAlt: coverImageUrl ? `Cover illustration for ${cleanTitle}` : undefined,
    contentHash,
  };
}

/**
 * Main Background AI Content Optimizer
 */
export async function generateCompletePostMetadata(input: PostMetadataInput): Promise<CompletePostMetadata> {
  const {
    title = '',
    content = '',
    persona = 'builder',
    coverImageUrl = '',
    manualOverrides = [],
    existingData = {},
  } = input;

  const contentHash = computeContentHash(title, content, persona, coverImageUrl);
  const heuristic = generateHeuristicMetadata(title, content, persona, coverImageUrl);

  const apiKey = process.env.AI_API_KEY?.trim();
  if (!apiKey) {
    return mergeWithOverrides(heuristic, existingData, manualOverrides, contentHash);
  }

  const model = process.env.AI_MODEL?.trim() || 'deepseek-ai/deepseek-v4-flash';
  let baseUrl = 'https://integrate.api.nvidia.com/v1/chat/completions';
  if (process.env.AI_BASE_URL?.trim()) {
    baseUrl = process.env.AI_BASE_URL.trim();
    if (!baseUrl.endsWith('/chat/completions')) {
      baseUrl = baseUrl.replace(/\/+$/, '') + '/chat/completions';
    }
  }

  const cleanText = cleanContentText(content);
  const promptSnippet = cleanText.slice(0, 4000);

  const systemPrompt = `You are a background SEO & Content Optimization Engine for an author's personal publication.
The site features 4 writing channels/personas:
- "builder": Systems engineering, software design, architecture, technical reflections.
- "thinker": Philosophy, epistemological inquiry, mental models, essays.
- "operator": Tactical security, execution, operations, workflows.
- "wanderer": Field sketches, travel reflections, observations, culture.

TASK:
Analyze the Article Title, Persona, and Content. Generate production-ready metadata:
1. "seoTitle": Clear, high-impact SEO title (50-60 characters maximum, no clickbait or keyword stuffing).
2. "seoDescription": Meta description for search engines (130-160 characters, natural summary).
3. "excerpt": A rich 1-2 sentence article summary for feed and card displays (120-200 characters) in the persona's voice.
4. "suggestedSlug": Clean, kebab-case URL slug (e.g. "understanding-distributed-consensus").
5. "ogTitle": OpenGraph sharing title.
6. "ogDescription": OpenGraph sharing description.
7. "twitterTitle": Twitter/X card title.
8. "twitterDescription": Twitter/X card summary.
9. "tags": 3 to 6 lowercase specific topic tags (e.g. ["distributed-systems", "raft", "databases"]).
10. "keywords": 5 to 8 search terms / keywords.
11. "suggestedCategory": Channel or category name (e.g. "${persona}").
12. "coverImageAlt": Concise alt text describing the article theme for screen readers.

OUTPUT FORMAT:
Return ONLY valid JSON matching this schema with no explanation, preamble, or markdown backticks:
{
  "seoTitle": "string",
  "seoDescription": "string",
  "excerpt": "string",
  "suggestedSlug": "string",
  "ogTitle": "string",
  "ogDescription": "string",
  "twitterTitle": "string",
  "twitterDescription": "string",
  "tags": ["string", "string"],
  "keywords": ["string", "string"],
  "suggestedCategory": "string",
  "coverImageAlt": "string"
}`;

  const userPrompt = `Title: ${title || 'Untitled Post'}
Persona: ${persona}
${coverImageUrl ? `Cover Image Available: Yes` : `Cover Image Available: No`}

Article Content:
${promptSnippet || '(Short note without body text)'}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 14000);

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.35,
        max_tokens: 600,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`AI content optimization HTTP error (${response.status}): using heuristic fallbacks.`);
      return mergeWithOverrides(heuristic, existingData, manualOverrides, contentHash);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) {
      return mergeWithOverrides(heuristic, existingData, manualOverrides, contentHash);
    }

    const cleanJson = rawContent
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(cleanJson);

    const generated: CompletePostMetadata = {
      seoTitle: (typeof parsed.seoTitle === 'string' && parsed.seoTitle.trim()) ? parsed.seoTitle.trim() : heuristic.seoTitle,
      seoDescription: (typeof parsed.seoDescription === 'string' && parsed.seoDescription.trim()) ? parsed.seoDescription.trim() : heuristic.seoDescription,
      excerpt: (typeof parsed.excerpt === 'string' && parsed.excerpt.trim()) ? parsed.excerpt.trim() : heuristic.excerpt,
      suggestedSlug: (typeof parsed.suggestedSlug === 'string' && parsed.suggestedSlug.trim()) ? slugify(parsed.suggestedSlug) : heuristic.suggestedSlug,
      ogTitle: (typeof parsed.ogTitle === 'string' && parsed.ogTitle.trim()) ? parsed.ogTitle.trim() : heuristic.ogTitle,
      ogDescription: (typeof parsed.ogDescription === 'string' && parsed.ogDescription.trim()) ? parsed.ogDescription.trim() : heuristic.ogDescription,
      twitterTitle: (typeof parsed.twitterTitle === 'string' && parsed.twitterTitle.trim()) ? parsed.twitterTitle.trim() : heuristic.twitterTitle,
      twitterDescription: (typeof parsed.twitterDescription === 'string' && parsed.twitterDescription.trim()) ? parsed.twitterDescription.trim() : heuristic.twitterDescription,
      tags: Array.isArray(parsed.tags) && parsed.tags.length > 0
        ? Array.from(new Set<string>(
            parsed.tags
              .filter((t: any): t is string => typeof t === 'string')
              .map((t: string) => t.toLowerCase().trim().replace(/[^a-z0-9-]/g, ''))
              .filter((t: string) => t.length > 1 && t.length < 35)
          )).slice(0, 6)
        : heuristic.tags,
      keywords: Array.isArray(parsed.keywords) && parsed.keywords.length > 0
        ? Array.from(new Set<string>(
            parsed.keywords
              .filter((k: any): k is string => typeof k === 'string')
              .map((k: string) => k.toLowerCase().trim())
              .filter((k: string) => k.length > 1 && k.length < 40)
          )).slice(0, 10)
        : heuristic.keywords,
      suggestedCategory: (typeof parsed.suggestedCategory === 'string' && parsed.suggestedCategory.trim()) ? parsed.suggestedCategory.trim() : persona,
      coverImageAlt: (typeof parsed.coverImageAlt === 'string' && parsed.coverImageAlt.trim()) ? parsed.coverImageAlt.trim() : heuristic.coverImageAlt,
      contentHash,
    };

    return mergeWithOverrides(generated, existingData, manualOverrides, contentHash);
  } catch (err: any) {
    console.warn(`AI content optimization error (${err.message}): using heuristic fallbacks.`);
    return mergeWithOverrides(heuristic, existingData, manualOverrides, contentHash);
  }
}

/**
 * Merges freshly generated metadata with existing user manual overrides.
 * Fields marked in `manualOverrides` will strictly preserve their user-edited values.
 */
function mergeWithOverrides(
  generated: CompletePostMetadata,
  existingData: Partial<CompletePostMetadata> = {},
  manualOverrides: string[] = [],
  contentHash: string
): CompletePostMetadata {
  const result = { ...generated, contentHash };
  const overrideSet = new Set(manualOverrides);

  if (overrideSet.has('seoTitle') && existingData.seoTitle) result.seoTitle = existingData.seoTitle;
  if (overrideSet.has('seoDescription') && existingData.seoDescription) result.seoDescription = existingData.seoDescription;
  if (overrideSet.has('excerpt') && existingData.excerpt) result.excerpt = existingData.excerpt;
  if (overrideSet.has('slug') && existingData.suggestedSlug) result.suggestedSlug = existingData.suggestedSlug;
  if (overrideSet.has('ogTitle') && existingData.ogTitle) result.ogTitle = existingData.ogTitle;
  if (overrideSet.has('ogDescription') && existingData.ogDescription) result.ogDescription = existingData.ogDescription;
  if (overrideSet.has('twitterTitle') && existingData.twitterTitle) result.twitterTitle = existingData.twitterTitle;
  if (overrideSet.has('twitterDescription') && existingData.twitterDescription) result.twitterDescription = existingData.twitterDescription;
  if (overrideSet.has('tags') && existingData.tags && existingData.tags.length > 0) result.tags = existingData.tags;
  if (overrideSet.has('keywords') && existingData.keywords && existingData.keywords.length > 0) result.keywords = existingData.keywords;
  if (overrideSet.has('coverImageAlt') && existingData.coverImageAlt) result.coverImageAlt = existingData.coverImageAlt;

  return result;
}

/**
 * Backward compatibility helper for simple excerpt & tags generation
 */
export async function generatePostMetadata(input: { title: string; content: string; persona?: string }): Promise<PostMetadataOutput> {
  const complete = await generateCompletePostMetadata({
    title: input.title,
    content: input.content,
    persona: input.persona,
  });
  return {
    excerpt: complete.excerpt,
    tags: complete.tags,
  };
}
