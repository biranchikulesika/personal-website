/**
 * Fetch and Group Commits
 * * Fetches commits from GitHub for the last N days
 * Groups them intelligently by feature area
 * Filters out noise (meta commits, automated changes)
 */

// Which repos to monitor
const WATCHED_REPOS = [
  { owner: "biranchikulesika", repo: "lipy" },
  { owner: "biranchikulesika", repo: "kulesika" },
  { owner: "biranchikulesika", repo: "verte" },
  { owner: "biranchikulesika", repo: "linkinbio" },
  { owner: "biranchikulesika", repo: "biranchi" },
  { owner: "biranchikulesika", repo: "bayo" },
  { owner: "biranchikulesika", repo: "pracg" },
  { owner: "biranchikulesika", repo: "TRB" },
  { owner: "biranchikulesika", repo: "Assignments" },
  { owner: "biranchikulesika", repo: "nusca" },
  { owner: "biranchikulesika", repo: "puppy" },
  { owner: "biranchikulesika", repo: "prashnify" },
  { owner: "biranchikulesika", repo: "Keeler" },
  { owner: "biranchikulesika", repo: "Sopo" },
  { owner: "biranchikulesika", repo: "deeler" },
  { owner: "biranchikulesika", repo: "velcroso" },
  { owner: "biranchikulesika", repo: "imca_food_census" },
  { owner: "biranchikulesika", repo: "scraper" },
  { owner: "biranchikulesika", repo: "biranchikulesika" },
];

/**
 * Fetch commits from GitHub API for last N days
 */
async function fetchLastNDaysCommits(daysBack = 1) {
  const commits = [];
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - daysBack);

  console.log(`     Fetching since: ${sinceDate.toISOString().split("T")[0]}`);

  for (const { owner, repo } of WATCHED_REPOS) {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/commits?since=${sinceDate.toISOString()}&per_page=100`;

      const headers = {
        Accept: "application/vnd.github.v3+json",
      };

      if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim() !== "") {
        headers["Authorization"] = `token ${process.env.GITHUB_TOKEN.trim()}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        console.warn(
          `     ⚠ Warning: Failed to fetch ${owner}/${repo} (${response.status})`,
        );
        continue;
      }

      const data = await response.json();

      // Map GitHub API response to our format
      const repoCommits = data.map((c) => ({
        repo,
        owner,
        sha: c.sha.slice(0, 7),
        message: c.commit.message,
        author: c.commit.author.name,
        date: c.commit.author.date,
        url: c.html_url,
      }));

      commits.push(...repoCommits);
    } catch (error) {
      console.warn(`     ⚠ Error fetching ${owner}/${repo}:`, error.message);
    }
  }

  return commits;
}

/**
 * Group commits by detected feature area
 * Filters out noise and meta-commits
 */
function groupCommits(commits) {
  const groups = {};

  for (const commit of commits) {
    // Skip noise
    if (isNoise(commit.message)) {
      continue;
    }

    // Detect feature area from commit message
    const feature = detectFeatureArea(commit.message);

    if (!groups[feature]) {
      groups[feature] = [];
    }
    groups[feature].push(commit);
  }

  return groups;
}

/**
 * Filter out commits that aren't meaningful (noise)
 */
function isNoise(message) {
  const noisePatterns = [
    /^build log/i,
    /^chore: update/i,
    /^automated/i,
    /^wip/i,
    /^fix typo/i,
    /^fix typos/i,
    /^remove console/i,
    /^revert/i,
    /^merge/i,
    /^conflict/i,
    /^format/i,
    /^prettier/i,
    /^eslint/i,
    /^lint/i,
    /^clean/i,
    /^bump/i,
    /^deps/i,
    /^dependency/i,
    /^update readme/i,
    /^minor/i,
  ];

  const firstLine = message.split("\n")[0].toLowerCase();

  return noisePatterns.some((pattern) => pattern.test(firstLine));
}

/**
 * Detect feature area from commit message
 * Returns one of predefined categories or 'GENERAL'
 */
function detectFeatureArea(message) {
  const lowercased = message.toLowerCase();

  // Keyword → Feature mapping
  const patterns = {
    TYPOGRAPHY: [
      "typography",
      "typeface",
      "font-",
      "font size",
      "text-",
      "line-height",
      "letter-spacing",
      "weight",
    ],
    SPACING: [
      "spacing",
      "padding",
      "margin",
      "gap-",
      "p-",
      "m-",
      "layout",
      "grid",
      "flex",
      "align",
    ],
    NAVIGATION: [
      "nav",
      "header",
      "sidebar",
      "menu",
      "footer",
      "breadcrumb",
      "link",
    ],
    INFRA: [
      "deps",
      "dependencies",
      "package",
      "npm",
      "config",
      "env",
      "build",
      "deploy",
      "ci",
      "github",
      "tsconfig",
      "next.config",
    ],
    DESIGN: [
      "color",
      "bg-",
      "border",
      "shadow",
      "style",
      "theme",
      "dark:",
      "opacity",
      "hover",
      "transition",
    ],
    CONTENT: [
      "content",
      "copy",
      "text",
      "markdown",
      "post",
      "article",
      "essay",
      "writing",
    ],
    SYSTEM: [
      "system",
      "refactor",
      "architecture",
      "pattern",
      "component",
      "lib",
      "util",
      "type",
      "interface",
    ],
    DATABASE: [
      "db",
      "table",
      "schema",
      "query",
      "supabase",
      "migration",
      "seed",
    ],
    API: [
      "api",
      "endpoint",
      "route",
      "fetch",
      "request",
      "response",
      "handler",
    ],
  };

  // Find first matching pattern
  for (const [area, keywords] of Object.entries(patterns)) {
    if (keywords.some((kw) => lowercased.includes(kw))) {
      return area;
    }
  }

  return "GENERAL";
}

export {
  fetchLastNDaysCommits,
  groupCommits,
  detectFeatureArea,
  WATCHED_REPOS,
};
