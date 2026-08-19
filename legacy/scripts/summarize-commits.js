/**
 * Summarize Commits with AI API
 * * Takes a group of related commits and generates a structured
 * build log entry matching the Builder persona voice.
 * Now supports switching AI models via environment variables.
 */

async function generateLogEntry(commits, feature) {
  // Format commits for the prompt
  const commitList = commits
    .map(c => `- ${c.message.split('\n')[0].trim()}`)
    .join('\n');

  // Provider configuration based on canonical AI environment variables
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || 'deepseek-ai/deepseek-v4-flash';
  
  let baseUrl = 'https://integrate.api.nvidia.com/v1/chat/completions';
  if (process.env.AI_BASE_URL) {
    baseUrl = process.env.AI_BASE_URL.trim();
    if (!baseUrl.endsWith('/chat/completions')) {
      baseUrl = baseUrl.replace(/\/$/, '') + '/chat/completions';
    }
  }

  // Craft the system prompt to enforce Builder persona and filtering
  const systemPrompt = `You are a technical writer generating build logs for a Builder persona.

The Builder is:
- Deeply technical and systems-focused
- Reflective and intentional, not reactive
- Precise language, no marketing or hype
- Emphasis on constraints, tradeoffs, and learnings
- Quiet confidence and understated tone
- Focused on clarity and long-term usefulness

CRITICAL INSTRUCTION:
Review the provided commits. If the commits represent ONLY minor changes such as typo fixes, code formatting, trivial refactors, or automated dependency bumps, you MUST reject them by returning exactly:
{ "skip": true }

If the work is substantial enough to log, return a valid JSON object matching this schema exactly:
{
  "skip": false,
  "tag": "One or two word category (e.g. TYPOGRAPHY, DATABASE, INFRA, UI SYSTEM)",
  "title": "One-line summary (max 60 characters, be specific)",
  "short_summary": "1-2 sentences summarizing what was done and the immediate outcome.",
  "long_summary": "A longer, detailed explanation of the problem, what was changed/built technically, and the concrete results. Format as a reflective, technical narrative. (3-5 sentences)"
}

You ONLY respond with valid JSON. No markdown, no preamble, no code blocks.`;

  const userPrompt = `Generate a build log entry for this work.

Feature Area: ${feature}

Related Commits:
${commitList}

Remember: Return ONLY a valid JSON object. Evaluate if these commits are worth logging.`;

  async function attemptRequest(retries = 3, baseDelay = 2000) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 600,
            top_p: 0.9
          })
        });

        if (response.ok) return response;

        const errorBody = await response.json().catch(() => ({}));
        const errorMsg = errorBody.error?.message || JSON.stringify(errorBody);

        // ResourceExhausted / quota exhausted — permanent, no point retrying
        if (errorMsg.includes('ResourceExhausted') || errorMsg.includes('quota') || errorMsg.includes('rate limit')) {
          console.error(`       ✗ API quota exhausted (${response.status}): ${errorMsg}`);
          return { quotaExhausted: true, error: errorMsg };
        }

        // 5xx server errors — retry with backoff
        if (response.status >= 500) {
          if (attempt < retries) {
            const delay = baseDelay * Math.pow(2, attempt);
            console.log(`       ⏳ API error (${response.status}), retrying in ${delay}ms... (attempt ${attempt + 1}/${retries})`);
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          console.error(`       ✗ API error (${response.status}) after ${retries} retries: ${errorMsg}`);
          return { quotaExhausted: false, error: errorMsg };
        }

        // 4xx errors other than quota — don't retry
        console.error(`       ✗ API error (${response.status}): ${errorMsg}`);
        return { quotaExhausted: false, error: errorMsg };

      } catch (fetchError) {
        if (attempt < retries) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.log(`       ⏳ Request failed (${fetchError.message}), retrying in ${delay}ms... (attempt ${attempt + 1}/${retries})`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        console.error(`       ✗ Request failed after ${retries} retries:`, fetchError.message);
        return { quotaExhausted: false, error: fetchError.message };
      }
    }
    return { quotaExhausted: false, error: 'Max retries exceeded' };
  }

  const result = await attemptRequest();
  if (!result || result.quotaExhausted || result.error) {
    if (result?.quotaExhausted) {
      console.log(`       → API quota exhausted. Use generateLogEntryLocal() as fallback.`);
    }
    return null;
  }

  // On success, parse the AI response
  try {
    const data = await result.json();
    let content = data.choices[0].message.content.trim();

    // Clean up potential markdown formatting from AI if it disobeys instructions
    if (content.startsWith('\`\`\`json')) {
      content = content.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
    } else if (content.startsWith('\`\`\`')) {
      content = content.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
    }

    // Parse the JSON response
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error(`       ✗ Failed to parse AI response as JSON`);
      console.error(`       Response was: ${content.substring(0, 100)}...`);
      return null;
    }

    if (parsed.skip === true) {
      console.log(`       → AI determined commits are minor/noise. Skipping log generation.`);
      return null;
    }

    // Build the complete log entry matching the updated schema
    const logEntry = {
      // UI fields
      title: parsed.title || 'Build work completed',
      category: parsed.tag || feature,
      short_summary: parsed.short_summary || '',
      long_summary: parsed.long_summary || '',
      date: new Date().toISOString().split('T')[0],

      // Database fields
      source: 'automated',
      aiGenerated: true,
      generatedAt: new Date().toISOString(),
      generationModel: model,
      relatedCommits: commits.map(c => c.sha),
      relatedRepositories: [...new Set(commits.map(c => c.repo))],
      hidden: false,

      // Raw AI output (for reference)
      _aiGenerated: parsed
    };

    return logEntry;

  } catch (error) {
    console.error(`       ✗ Request failed:`, error.message);
    return null;
  }
}

/**
 * Alternative: Local summarization (fallback)
 * If API is down or you want cost-free option
 */
function generateLogEntryLocal(commits, feature) {
  const firstCommit = commits[0].message.split('\n')[0];

  return {
    title: firstCommit.substring(0, 60),
    category: feature,
    short_summary: `Completed ${commits.length} commits in ${feature}`,
    long_summary: `Updated ${feature} systems with ${commits.length} changes. Local fallback generation used.`,
    date: new Date().toISOString().split('T')[0],
    source: 'automated',
    aiGenerated: false,
    relatedCommits: commits.map(c => c.sha),
    relatedRepositories: [...new Set(commits.map(c => c.repo))],
    hidden: false
  };
}

export {
  generateLogEntry,
  generateLogEntryLocal
};