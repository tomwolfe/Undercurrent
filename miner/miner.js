/* eslint-disable @typescript-eslint/no-require-imports */
const { graphql } = require("@octokit/graphql");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const graphqlWithAuth = GITHUB_TOKEN ? graphql.defaults({
  headers: {
    authorization: `token ${GITHUB_TOKEN}`,
  },
}) : null;

// Targeted languages to ensure diversity in discovery
const TARGET_LANGUAGES = [
  "TypeScript", "JavaScript", "Rust", "Go", "Python", 
  "Zig", "Swift", "Kotlin", "C++", "Mojo", "Odin"
];

const CHURN_KEYWORDS = [
  "config", "vpn", "proxy", "list", "index", "blocklist", 
  "iptv", "rules", "detect", "scripts", "backup", "hot-search", 
  "trending", "awesome-list", "collection", "mirrors", "database",
  "dns", "auto-updated", "hosts", "payload", "cve", "poc"
];

function isLikelyChurn(repo) {
  const name = repo.name.toLowerCase();
  const description = (repo.description || "").toLowerCase();
  const fullName = `${repo.owner.login}/${repo.name}`.toLowerCase();

  // Check for churn keywords in name or description
  if (CHURN_KEYWORDS.some(keyword => name.includes(keyword) || description.includes(keyword))) {
    return true;
  }

  // Common automated repo patterns
  if (name.match(/\d{4}-\d{2}-\d{2}/) || name.match(/\d{6,}/)) {
    return true;
  }

  return false;
}

function calculateScore(repo, recentCommits, labeledIssuesCount, hasGoodFirstIssues) {
  const stars = Math.max(1, repo.stargazerCount);
  const createdAt = new Date(repo.createdAt);
  const ageInMonths = Math.max(6, (new Date() - createdAt) / (1000 * 60 * 60 * 24 * 30.44));

  // 1. Momentum: Cap the impact of raw commit volume to prevent automated repos from dominating
  // Using log2 to reward activity but with diminishing returns for extreme volumes
  const momentum = Math.log2(recentCommits + 1) * 20;
  
  // 2. Contribution: Reward repositories that are actively seeking contributors
  const contribution = (labeledIssuesCount * 2) + (hasGoodFirstIssues ? 50 : 0);
  
  // 3. Visibility Penalty: "Hidden gems" should be harder to find
  const visibilityFactor = Math.log10(stars + 1);
  
  // 4. Maturity: Age provides a base stability factor, capped to avoid over-rewarding ancient repos
  const maturityFactor = Math.sqrt(Math.min(ageInMonths, 60));

  // 5. Language Multiplier: Boost targeted languages
  const lang = repo.primaryLanguage ? repo.primaryLanguage.name : "Plain Text";
  let langMultiplier = 1.0;
  if (TARGET_LANGUAGES.includes(lang)) langMultiplier = 1.2;
  if (lang === "Plain Text" || lang === "HTML" || lang === "CSS") langMultiplier = 0.5;

  // Final formula: ((Momentum + Contribution + 10) / (Visibility * Maturity)) * multiplier
  const rawScore = ((momentum + contribution + 10) / (visibilityFactor * maturityFactor)) * langMultiplier;
  
  return Math.round(rawScore * 100) / 100;
}

async function fetchReposForQuery(searchQuery, timeframes) {
  if (!graphqlWithAuth) {
    throw new Error("GitHub token not configured");
  }
  const query = `
    query($searchQuery: String!) {
      search(query: $searchQuery, type: REPOSITORY, first: 50) {
        edges {
          node {
            ... on Repository {
              name
              owner { login }
              description
              url
              stargazerCount
              createdAt
              pushedAt
              primaryLanguage { name }
              defaultBranchRef {
                target {
                  ... on Commit {
                    w1: history(since: "${timeframes.w1}") { totalCount }
                    w2: history(since: "${timeframes.w2}", until: "${timeframes.w1}") { totalCount }
                    w3: history(since: "${timeframes.w3}", until: "${timeframes.w2}") { totalCount }
                    w4: history(since: "${timeframes.w4}", until: "${timeframes.w3}") { totalCount }
                  }
                }
              }
              issues(states: OPEN, labels: ["good first issue"], first: 1) { totalCount }
              repositoryLabels: labels { totalCount }
            }
          }
        }
      }
    }
  `;

  try {
    const result = await graphqlWithAuth(query, { searchQuery });
    return result.search.edges.map(edge => edge.node).filter(Boolean);
  } catch (error) {
    console.error(`Error fetching for query "${searchQuery}":`, error.message);
    return [];
  }
}

async function getGems() {
  console.log("Starting enhanced gem mining process...");
  const now = new Date();
  const sixMonthsAgo = new Date(new Date().setMonth(now.getMonth() - 6)).toISOString().split('T')[0];
  
  const timeframes = {
    w1: new Date(new Date().setDate(now.getDate() - 7)).toISOString(),
    w2: new Date(new Date().setDate(now.getDate() - 14)).toISOString(),
    w3: new Date(new Date().setDate(now.getDate() - 21)).toISOString(),
    w4: new Date(new Date().setDate(now.getDate() - 28)).toISOString()
  };

  const allRepos = new Map();

  // 1. Generic query for the best current gems across all languages
  const baseQuery = `stars:150..3000 created:<${sixMonthsAgo} pushed:>${new Date(new Date().setDate(now.getDate() - 7)).toISOString().split('T')[0]} sort:updated-desc`;
  console.log("Executing base discovery query...");
  const baseRepos = await fetchReposForQuery(baseQuery, timeframes);
  baseRepos.forEach(repo => allRepos.set(`${repo.owner.login}/${repo.name}`, repo));

  // 2. Targeted language queries to find hidden gems in specific ecosystems
  // Only search for languages that aren't already well-represented or to find more niche gems
  for (const lang of TARGET_LANGUAGES) {
    console.log(`Searching for ${lang} gems...`);
    const langQuery = `${baseQuery} language:${lang}`;
    const langRepos = await fetchReposForQuery(langQuery, timeframes);
    let newCount = 0;
    langRepos.forEach(repo => {
      const key = `${repo.owner.login}/${repo.name}`;
      if (!allRepos.has(key)) {
        allRepos.set(key, repo);
        newCount++;
      }
    });
    console.log(`  Added ${newCount} new unique ${lang} repos.`);
    // Small delay to be nice to the API
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log(`Total unique repositories found: ${allRepos.size}. Calculating scores...`);

  const scoredRepos = Array.from(allRepos.values())
    .filter(repo => !isLikelyChurn(repo))
    .map(repo => {
      try {
        const w1 = repo.defaultBranchRef?.target?.w1?.totalCount || 0;
        const w2 = repo.defaultBranchRef?.target?.w2?.totalCount || 0;
        const w3 = repo.defaultBranchRef?.target?.w3?.totalCount || 0;
        const w4 = repo.defaultBranchRef?.target?.w4?.totalCount || 0;

        const activity = [w4, w3, w2, w1];
        const avgActivity = (w2 + w3 + w4) / 3;
        const momentumTrend = avgActivity === 0 ? (w1 > 0 ? 1 : 0) : (w1 / avgActivity);

        const labeledIssuesCount = repo.repositoryLabels?.totalCount || 0;
        const hasGoodFirstIssues = repo.issues.totalCount > 0;
        const score = calculateScore(repo, w1, labeledIssuesCount, hasGoodFirstIssues);

        return {
          name: repo.name,
          full_name: `${repo.owner.login}/${repo.name}`,
          description: repo.description,
          url: repo.url,
          stars: repo.stargazerCount,
          language: repo.primaryLanguage ? repo.primaryLanguage.name : "Plain Text",
          gem_score: score,
          momentum_trend: Math.round(momentumTrend * 100) / 100,
          recent_commits: w1,
          activity: activity,
          good_first_issues_url: `${repo.url}/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22`,
          has_good_first_issues: hasGoodFirstIssues,
          pushed_at: repo.pushedAt
        };
      } catch {
        return null;
      }
    }).filter(Boolean);

  // Sort and filter
  const topGems = scoredRepos
    .sort((a, b) => b.gem_score - a.gem_score)
    .slice(0, 150); // Increased to 150 gems for better variety

  const output = {
    last_mined: new Date().toISOString(),
    count: topGems.length,
    gems: topGems
  };

  const outputPath = path.join(__dirname, "../public/gems.json");
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`Successfully mined ${topGems.length} gems and saved to public/gems.json`);
}

module.exports = { calculateScore };

if (require.main === module) {
  if (!GITHUB_TOKEN) {
    console.error("GITHUB_TOKEN is required");
    process.exit(1);
  }
  getGems();
}