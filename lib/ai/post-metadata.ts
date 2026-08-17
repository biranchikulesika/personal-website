/**
 * AI-Powered Post Metadata Generator
 * Generates concise summaries/excerpts and relevant tags using configured AI models.
 * Automatically falls back to smart natural language extraction heuristics if offline or unconfigured.
 */

export interface PostMetadataInput {
  title: string;
  content: string;
  persona?: string;
}

export interface PostMetadataOutput {
  excerpt: string;
  tags: string[];
}

function cleanContentText(content: string): string {
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
    // Remove markdown headings, bold, italic
    .replace(/^[#\s=->]+/gm, '')
    .replace(/[*_~]+/g, '')
    // Normalize spaces
    .replace(/\s+/g, ' ')
    .trim();
}

function extractHeuristicExcerpt(cleanText: string, title: string): string {
  if (!cleanText || cleanText.length < 20) {
    return title ? `An exploration into ${title.toLowerCase()}.` : 'A personal reflection and inquiry.';
  }

  // Look for the first 1-2 complete sentences
  const sentenceMatch = cleanText.match(/^([^.!?]+[.!?]\s*[^.!?]+[.!?])/);
  if (sentenceMatch && sentenceMatch[1] && sentenceMatch[1].length <= 260) {
    return sentenceMatch[1].trim();
  }

  // Fallback: first sentence or 180 chars
  const firstSentence = cleanText.split(/[.!?]/)[0];
  if (firstSentence && firstSentence.length >= 30 && firstSentence.length <= 220) {
    return firstSentence.trim() + '.';
  }

  // Slice neatly on word boundary
  if (cleanText.length > 180) {
    return cleanText.slice(0, 180).replace(/\s+\S*$/, '') + '...';
  }

  return cleanText;
}

function extractHeuristicTags(cleanText: string, persona: string, title: string): string[] {
  const personaDefaultTags: Record<string, string[]> = {
    builder: ['systems', 'engineering', 'architecture', 'software'],
    thinker: ['philosophy', 'essays', 'inquiry', 'mindset'],
    operator: ['operations', 'security', 'tactics', 'execution'],
    wanderer: ['field-notes', 'travel', 'observations', 'culture'],
  };

  const defaults = personaDefaultTags[persona.toLowerCase()] || ['writing', 'essays', 'thoughts'];
  const textWords = `${title} ${cleanText}`.toLowerCase().split(/[^a-z0-9-]+/).filter(w => w.length > 4);
  
  const commonKeywords: Record<string, string> = {
    javascript: 'javascript',
    typescript: 'typescript',
    react: 'react',
    nextjs: 'nextjs',
    design: 'design',
    database: 'database',
    security: 'security',
    performance: 'performance',
    automation: 'automation',
    ai: 'ai',
    architecture: 'architecture',
    systems: 'systems',
    privacy: 'privacy',
    productivity: 'productivity',
    strategy: 'strategy',
    photography: 'photography',
    travel: 'travel',
    nature: 'nature',
    life: 'life',
    notes: 'notes',
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

  return Array.from(matched);
}

export async function generatePostMetadata(input: PostMetadataInput): Promise<PostMetadataOutput> {
  const { title = '', content = '', persona = 'builder' } = input;
  const cleanText = cleanContentText(content);

  // Fallback defaults
  const fallbackExcerpt = extractHeuristicExcerpt(cleanText, title);
  const fallbackTags = extractHeuristicTags(cleanText, persona, title);

  const apiKey = process.env.AI_API_KEY?.trim();
  if (!apiKey) {
    return {
      excerpt: fallbackExcerpt,
      tags: fallbackTags,
    };
  }

  const model = process.env.AI_MODEL?.trim() || 'deepseek-ai/deepseek-v4-flash';
  let baseUrl = 'https://integrate.api.nvidia.com/v1/chat/completions';
  if (process.env.AI_BASE_URL?.trim()) {
    baseUrl = process.env.AI_BASE_URL.trim();
    if (!baseUrl.endsWith('/chat/completions')) {
      baseUrl = baseUrl.replace(/\/+$/, '') + '/chat/completions';
    }
  }

  const promptSnippet = cleanText.slice(0, 3500);
  const systemPrompt = `You are an editorial assistant for a curated personal publication.
The author writes across 4 personas:
- "builder": Systems engineering, software architecture, technical deep dives.
- "thinker": Philosophical essays, mental models, epistemological reflections.
- "operator": Tactical execution, security, operations, practical systems.
- "wanderer": Field sketches, travel reflections, observations, culture.

TASK:
Analyze the given article Title, Persona, and Content.
Generate:
1. "excerpt": A compelling, concise 1-2 sentence summary (100-200 characters) written in the voice of the persona.
2. "tags": An array of 3 to 6 lowercase, relevant, specific tags (e.g. ["systems", "distributed-systems", "database"]).

OUTPUT FORMAT:
Return ONLY valid JSON matching this schema with no explanation, preamble, or markdown formatting:
{
  "excerpt": "string",
  "tags": ["string", "string", "string"]
}`;

  const userPrompt = `Title: ${title || 'Untitled Post'}
Persona: ${persona}

Article Content:
${promptSnippet || '(Short note without body text)'}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

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
        temperature: 0.4,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`AI metadata generation HTTP error (${response.status}): using fallback heuristics.`);
      return { excerpt: fallbackExcerpt, tags: fallbackTags };
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) {
      return { excerpt: fallbackExcerpt, tags: fallbackTags };
    }

    // Strip any markdown code fences if returned
    const cleanJson = rawContent
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(cleanJson);

    const excerpt = typeof parsed.excerpt === 'string' && parsed.excerpt.trim().length > 10
      ? parsed.excerpt.trim()
      : fallbackExcerpt;

    let tags: string[] = fallbackTags;
    if (Array.isArray(parsed.tags) && parsed.tags.length > 0) {
      const sanitized: string[] = parsed.tags
        .filter((t: any): t is string => typeof t === 'string')
        .map((t: string) => t.toLowerCase().trim().replace(/[^a-z0-9-]/g, ''))
        .filter((t: string) => t.length > 1 && t.length < 30);

      if (sanitized.length > 0) {
        tags = Array.from(new Set<string>(sanitized)).slice(0, 6);
      }
    }

    return { excerpt, tags };
  } catch (err: any) {
    console.warn(`AI metadata generation failed (${err.message}): using fallback heuristics.`);
    return { excerpt: fallbackExcerpt, tags: fallbackTags };
  }
}
