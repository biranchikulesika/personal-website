import type { Persona } from '@/lib/types';
import { slugify } from '@/lib/utils';

export interface AiMetadataResult {
  excerpt: string;
  alternateExcerpts: string[];
  suggestedSlug: string;
  slugCandidates: string[];
  tags: string[];
  keyThemes: string[];
}

/**
 * Intelligent heuristic fallback when no external AI API key is configured.
 * Extracts meaningful thesis statements, candidate slugs, and thematic tags.
 */
function heuristicGenerate(
  title: string,
  content: string,
  persona: Persona = 'builder'
): AiMetadataResult {
  const cleanTitle = (title || 'Untitled Document').trim();
  const cleanBody = content
    .replace(/^#+\s.*$/gm, '') // remove headings
    .replace(/```[\s\S]*?```/g, '') // remove code blocks
    .replace(/!\[.*?\]\(.*?\)/g, '') // remove images
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // link labels
    .replace(/[>*_~`]/g, '') // formatting symbols
    .trim();

  const paragraphs = cleanBody
    .split('\n\n')
    .map((p) => p.trim().replace(/\s+/g, ' '))
    .filter((p) => p.length > 20);

  // 1. Excerpt generation
  let excerpt = '';
  if (paragraphs.length > 0) {
    // Pick the first substantive paragraph or sentence
    const firstP = paragraphs[0];
    const sentences = firstP.split(/(?<=[.?!])\s+/);
    if (sentences.length >= 2 && (sentences[0] + ' ' + sentences[1]).length < 200) {
      excerpt = sentences[0] + ' ' + sentences[1];
    } else if (sentences[0].length < 180) {
      excerpt = sentences[0];
    } else {
      excerpt = firstP.slice(0, 160) + '...';
    }
  } else {
    excerpt = `A thoughtful exploration on ${cleanTitle.toLowerCase()} from the perspective of the ${persona}.`;
  }

  const alternateExcerpts: string[] = [];
  if (paragraphs.length > 1) {
    alternateExcerpts.push(paragraphs[1].slice(0, 150) + '...');
  }
  alternateExcerpts.push(`Reflections on ${cleanTitle.toLowerCase()} and digital craftsmanship.`);

  // 2. Slug candidates
  const baseSlug = slugify(cleanTitle);
  const words = cleanTitle.toLowerCase().split(/\s+/).filter(Boolean);
  const slugCandidates = [
    baseSlug,
    words.length > 3 ? slugify(words.slice(0, 3).join(' ')) : `${baseSlug}-notes`,
    `on-${baseSlug}`,
    `${persona}-${baseSlug}`,
  ].filter(Boolean);

  // 3. Tags & Keywords extraction
  const stopWords = new Set([
    'the', 'and', 'for', 'that', 'with', 'this', 'from', 'have', 'were', 'which',
    'about', 'into', 'some', 'than', 'them', 'then', 'they', 'what', 'when', 'where',
    'will', 'more', 'also', 'their', 'there', 'could', 'would', 'should', 'been',
  ]);

  const wordCounts: Record<string, number> = {};
  const allWords = `${cleanTitle} ${cleanBody}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));

  for (const w of allWords) {
    wordCounts[w] = (wordCounts[w] || 0) + 1;
  }

  const sortedKeywords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w)
    .slice(0, 8);

  const defaultPersonaTags: Record<Persona, string[]> = {
    builder: ['craft', 'software', 'systems', 'tools'],
    operator: ['execution', 'discipline', 'focus', 'workflows'],
    thinker: ['philosophy', 'marginalia', 'inquiry', 'epistemology'],
    wanderer: ['fragments', 'travel', 'nature', 'observations'],
  };

  const tags = Array.from(
    new Set([...sortedKeywords.slice(0, 4), ...defaultPersonaTags[persona]])
  ).slice(0, 6);

  return {
    excerpt,
    alternateExcerpts,
    suggestedSlug: baseSlug || 'untitled-document',
    slugCandidates: Array.from(new Set(slugCandidates)).slice(0, 4),
    tags,
    keyThemes: sortedKeywords.slice(0, 5),
  };
}

/**
 * Generates document summary, excerpt, suggested permalinks, and taxonomy tags.
 * Connects to LLM endpoints if keys exist, or falls back seamlessly to deterministic NLP.
 */
export async function generateDocumentAiMetadata(input: {
  title: string;
  content: string;
  persona?: Persona;
  docType?: 'post' | 'note';
}): Promise<AiMetadataResult> {
  const { title, content, persona = 'builder', docType = 'post' } = input;

  const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || (process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions');
  const model = process.env.AI_MODEL || (process.env.GROQ_API_KEY ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini');

  const heuristic = heuristicGenerate(title, content, persona);

  if (!apiKey) {
    // Return heuristic response instantly if no API key is provided
    return heuristic;
  }

  const systemPrompt = `You are an editorial assistant for a quiet, high-craft personal digital garden ("biranchikulesika.com").
The author writes thoughtful essays, technical notes, and marginalia under four personas:
- Builder (craft, software systems, tools, architecture)
- Operator (execution, focus, business discipline, workflows)
- Thinker (epistemology, cognitive clarity, philosophy, mental models)
- Wanderer (poetic observations, travel, photography, serendipity)

Analyze the provided document title and body, then return structured JSON matching this schema:
{
  "excerpt": "A concise, elegant 1-2 sentence synopsis (under 160 characters) explaining the core thesis.",
  "alternateExcerpts": ["Alternative hook 1", "Alternative hook 2"],
  "suggestedSlug": "clean-kebab-case-slug",
  "slugCandidates": ["slug-option-1", "slug-option-2", "slug-option-3"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "keyThemes": ["theme1", "theme2", "theme3"]
}

Rules:
- Slugs must be clean kebab-case with lowercase letters and hyphens only.
- Tags must be clean, lowercase, one-word or hyphenated concepts.
- Return ONLY the JSON object without markdown formatting.`;

  const userPrompt = `Document Type: ${docType === 'post' ? 'Long-form Essay' : 'Atomic Note'}
Persona: ${persona}
Title: ${title || 'Untitled'}

Content:
${content ? content.slice(0, 4000) : '(No body text provided)'}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return heuristic;
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) return heuristic;

    const parsed = JSON.parse(rawContent);

    return {
      excerpt: typeof parsed.excerpt === 'string' && parsed.excerpt.trim() ? parsed.excerpt.trim() : heuristic.excerpt,
      alternateExcerpts: Array.isArray(parsed.alternateExcerpts) ? parsed.alternateExcerpts : heuristic.alternateExcerpts,
      suggestedSlug: typeof parsed.suggestedSlug === 'string' ? slugify(parsed.suggestedSlug) : heuristic.suggestedSlug,
      slugCandidates: Array.isArray(parsed.slugCandidates) && parsed.slugCandidates.length > 0
        ? parsed.slugCandidates.map((s: string) => slugify(s)).filter(Boolean)
        : heuristic.slugCandidates,
      tags: Array.isArray(parsed.tags) && parsed.tags.length > 0
        ? parsed.tags.map((t: string) => slugify(t)).filter(Boolean).slice(0, 6)
        : heuristic.tags,
      keyThemes: Array.isArray(parsed.keyThemes) ? parsed.keyThemes : heuristic.keyThemes,
    };
  } catch {
    return heuristic;
  }
}
