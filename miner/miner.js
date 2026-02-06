/* eslint-disable @typescript-eslint/no-require-imports */
const { graphql } = require("@octokit/graphql");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");
const { OpenAI } = require("openai");
require("dotenv").config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

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
  "dns", "auto-updated", "hosts", "payload", "cve", "poc",
  "homework", "assignment", "leetcode", "tutorial", "course"
];

const HYPE_KEYWORDS = [
  "ai", "llm", "gpt", "openai", "claude", "langchain", 
  "agent", "deepseek", "gemini", "llama", "mistral",
  "rag", "vector", "embedding", "anthropic", "cohere",
  "stable diffusion", "midjourney", "prompt engineering"
];

/**
 * Fetches current GitHub Trending repositories
 * @returns {Promise<string[]>} List of full_names
 */
async function fetchGitHubTrending() {
  try {
    const { data } = await axios.get("https://github.com/trending", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const $ = cheerio.load(data);
    const repos = [];
    $(".Box-row h2 a").each((i, el) => {
      const href = $(el).attr("href");
      if (href) {
        repos.push(href.startsWith("/") ? href.slice(1) : href);
      }
    });
    return repos;
  } catch (error) {
    console.error("Error fetching GitHub Trending:", error.message);
    return [];
  }
}

/**
 * Checks if a repository has been mentioned on Hacker News
 * @param {string} fullName 
 * @returns {Promise<boolean>}
 */
async function checkHackerNews(fullName) {
  try {
    const query = encodeURIComponent(fullName);
    const { data } = await axios.get(`https://hn.algolia.com/api/v1/search?query=${query}&tags=story`);
    return data.nbHits > 0;
  } catch (error) {
    console.error(`Error checking HN for ${fullName}:`, error.message);
    return false;
  }
}

/**
 * Generates an LLM summary for a repository README
 * @param {string} fullName 
 * @param {string} description 
 * @returns {Promise<string>}
 */
async function getLLMSummary(fullName, description) {
  if (!openai) return description || "No description available.";
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that summarizes GitHub repositories. Provide a concise, 1-sentence summary that captures the essence and unique value proposition of the project."
        },
        {
          role: "user",
          content: `Summarize this repository: ${fullName}. Description: ${description}`
        }
      ],
      max_tokens: 60
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error(`Error generating summary for ${fullName}:`, error.message);
    return description || "No description available.";
  }
}

/**
 * Fetches bundle size for JS/TS repositories
 * @param {string} name 
 * @returns {Promise<number|null>} size in bytes
 */
async function getBundleSize(name) {
  try {
    // Note: This is a heuristic. Not all GitHub names match NPM names.
    const { data } = await axios.get(`https://bundlephobia.com/api/size?package=${name.toLowerCase()}`);
    return data.size;
  } catch (error) {
    // Silent fail as many repos won't be on NPM
    return null;
  }
}

/**
 * Calculates maintenance score based on last PR merge
 * @param {string} lastMergedAt 
 * @returns {number} Days since last merge
 */
function calculateMaintenanceScore(lastMergedAt) {
  if (!lastMergedAt) return 999;
  const lastDate = new Date(lastMergedAt);
  const diffTime = Math.abs(new Date() - lastDate);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * @typedef {import('./types').Repository} Repository
 * @typedef {import('./types').ScoredGem} ScoredGem
 */

/**
 * Checks if a repository is likely to be "churn" (low quality, automated, etc.)
 * @param {Repository} repo 
 * @returns {boolean}
 */
function isLikelyChurn(repo) {
  const name = repo.name.toLowerCase();
  const description = (repo.description || "").toLowerCase();
  
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

/**
 * Checks if a repository matches "hype" keywords (AI, LLM, etc.)
 * @param {Repository} repo 
 * @returns {boolean}
 */
function isHype(repo) {
  const name = repo.name.toLowerCase();
  const description = (repo.description || "").toLowerCase();
  return HYPE_KEYWORDS.some(word => name.includes(word) || description.includes(word));
}

/**
 * Calculates the discovery score for a repository
 * @param {Repository} repo 
 * @param {number} recentCommits 
 * @param {number} mergedPrsCount 
 * @param {number} labeledIssuesCount 
 * @param {boolean} hasGoodFirstIssues 
 * @returns {number}
 */
function calculateScore(repo, recentCommits, mergedPrsCount, labeledIssuesCount, hasGoodFirstIssues) {
  const stars = Math.max(1, repo.stargazerCount);
  const createdAt = new Date(repo.createdAt);
  const ageInMonths = Math.max(6, (new Date() - createdAt) / (1000 * 60 * 60 * 24 * 30.44));

  // 1. Momentum: Cap the impact of raw commit volume to prevent automated repos from dominating
  const momentum = Math.log2(recentCommits + 1) * 20;
  
  // 2. PR Velocity: High-signal quality metric (merged PRs in last 30 days)
  const prVelocity = Math.log2(mergedPrsCount + 1) * 30;
  
  // 3. Contribution: Reward repositories that are actively seeking contributors
  const contribution = (labeledIssuesCount * 2) + (hasGoodFirstIssues ? 50 : 0);
  
  // 4. Visibility Penalty: "Hidden gems" should be harder to find
  const visibilityFactor = Math.log10(stars + 1);
  
  // 5. Maturity: Age provides a base stability factor, capped to avoid over-rewarding ancient repos
  const maturityFactor = Math.sqrt(Math.min(ageInMonths, 60));

  // 6. Language Multiplier: Boost targeted languages
  const lang = repo.primaryLanguage ? repo.primaryLanguage.name : "Plain Text";
  let langMultiplier = 1.0;
  if (TARGET_LANGUAGES.includes(lang)) langMultiplier = 1.2;
  if (lang === "Plain Text" || lang === "HTML" || lang === "CSS") langMultiplier = 0.5;

  // Final formula: ((Momentum + PRVelocity + Contribution + 10) / (Visibility * Maturity)) * multiplier
  const rawScore = ((momentum + prVelocity + contribution + 10) / (visibilityFactor * maturityFactor)) * langMultiplier;
  
  return Math.round(rawScore * 100) / 100;
}

async function fetchWithRetry(query, variables, maxRetries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (!graphqlWithAuth) {
        throw new Error("GitHub token not configured");
      }
      return await graphqlWithAuth(query, variables);
    } catch (error) {
      lastError = error;
      const status = error.status;
      const isRetryable = status === 403 || status === 502 || (error.message && error.message.includes("rate limit"));
      
      if (isRetryable && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`Retryable error (status: ${status}). Attempt ${attempt}/${maxRetries}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

async function fetchReposForQuery(searchQuery, timeframes, maxPages = 3) {
  const query = `
    query($searchQuery: String!, $cursor: String) {
      search(query: $searchQuery, type: REPOSITORY, first: 50, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
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
              licenseInfo { spdxId }
              repositoryTopics(first: 3) {
                nodes {
                  topic {
                    name
                  }
                }
              }
              mergedPrs: pullRequests(states: MERGED, first: 50, orderBy: {field: UPDATED_AT, direction: DESC}) {
                nodes {
                  mergedAt
                }
              }
              latestRelease {
                tagName
                publishedAt
              }
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
              openIssues: issues(states: OPEN) { totalCount }
              forkCount
              repositoryLabels: labels { totalCount }
            }
          }
        }
      }
    }
  `;

  let allRepos = [];
  let cursor = null;
  let page = 0;

  while (page < maxPages) {
    try {
      const result = await fetchWithRetry(query, { searchQuery, cursor });
      const repos = result.search.edges.map(edge => edge.node).filter(Boolean);
      allRepos = allRepos.concat(repos);

      if (!result.search.pageInfo.hasNextPage) break;
      cursor = result.search.pageInfo.endCursor;
      page++;
      
      // Respect secondary rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error fetching page ${page} for query "${searchQuery}":`, error.message);
      break;
    }
  }

  return allRepos;
}

async function getGems() {
  console.log("Starting deep gem mining process...");
  const now = new Date();
  const sixMonthsAgo = new Date(new Date().setMonth(now.getMonth() - 6)).toISOString().split('T')[0];
  
  const timeframes = {
    w1: new Date(new Date().setDate(now.getDate() - 7)).toISOString(),
    w2: new Date(new Date().setDate(now.getDate() - 14)).toISOString(),
    w3: new Date(new Date().setDate(now.getDate() - 21)).toISOString(),
    w4: new Date(new Date().setDate(now.getDate() - 28)).toISOString()
  };

  const allRepos = new Map();

  // 1. Trending discovery
  console.log("Fetching GitHub Trending...");
  const trendingFullNames = await fetchGitHubTrending();
  
  // To get full data for trending repos, we'll search for them specifically if they match our criteria
  // or just add them to the search set.
  for (const fullName of trendingFullNames.slice(0, 10)) { // Limit to top 10 for performance
    const [owner, name] = fullName.split("/");
    const trendingQuery = `repo:${fullName}`;
    const repos = await fetchReposForQuery(trendingQuery, timeframes, 1);
    repos.forEach(repo => allRepos.set(`${repo.owner.login}/${repo.name}`, repo));
  }

  // 2. Base discovery query
  const baseQuery = `stars:150..3000 created:<${sixMonthsAgo} pushed:>${new Date(new Date().setDate(now.getDate() - 7)).toISOString().split('T')[0]} sort:updated-desc`;
  console.log("Executing base discovery query (paginated)...");
  const baseRepos = await fetchReposForQuery(baseQuery, timeframes, 3);
  baseRepos.forEach(repo => allRepos.set(`${repo.owner.login}/${repo.name}`, repo));

  // 2. Targeted language queries
  for (const lang of TARGET_LANGUAGES) {
    console.log(`Searching for ${lang} gems...`);
    const langQuery = `${baseQuery} language:${lang}`;
    const langRepos = await fetchReposForQuery(langQuery, timeframes, 2);
    let newCount = 0;
    langRepos.forEach(repo => {
      const key = `${repo.owner.login}/${repo.name}`;
      if (!allRepos.has(key)) {
        allRepos.set(key, repo);
        newCount++;
      }
    });
    console.log(`  Added ${newCount} new unique ${lang} repos.`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`Total unique repositories found: ${allRepos.size}. Calculating scores and enriching data...`);

  const scoredRepos = await Promise.all(Array.from(allRepos.values())
    .filter(repo => !isLikelyChurn(repo))
    .map(async (repo) => {
      try {
        const fullName = `${repo.owner.login}/${repo.name}`;
        const w1 = repo.defaultBranchRef?.target?.w1?.totalCount || 0;
        const w2 = repo.defaultBranchRef?.target?.w2?.totalCount || 0;
        const w3 = repo.defaultBranchRef?.target?.w3?.totalCount || 0;
        const w4 = repo.defaultBranchRef?.target?.w4?.totalCount || 0;

        const activity = [w4, w3, w2, w1];
        const avgActivity = (w2 + w3 + w4) / 3;
        const momentumTrend = avgActivity === 0 ? (w1 > 0 ? 1 : 0) : (w1 / avgActivity);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const mergedPrs = repo.mergedPrs?.nodes || [];
        const mergedPrsCount = mergedPrs.filter(pr => new Date(pr.mergedAt) > thirtyDaysAgo).length;
        const lastMergedAt = mergedPrs.length > 0 ? mergedPrs[0].mergedAt : null;

        const topics = (repo.repositoryTopics?.nodes || []).map(node => node.topic.name);

        const labeledIssuesCount = repo.repositoryLabels?.totalCount || 0;
        const hasGoodFirstIssues = repo.issues.totalCount > 0;
        const score = calculateScore(repo, w1, mergedPrsCount, labeledIssuesCount, hasGoodFirstIssues);

        // Discovery Loop: Cross-reference Trending + HN
        const isTrending = trendingFullNames.includes(fullName);
        const isOnHN = isTrending ? await checkHackerNews(fullName) : false;
        const featured = isTrending && isOnHN;

        let description = repo.description;
        if (featured) {
          console.log(`  Featured gem found: ${fullName}! Generating summary...`);
          description = await getLLMSummary(fullName, repo.description);
        }

        // Decision Metrics
        const maintenance_score = calculateMaintenanceScore(lastMergedAt);
        const isJS = ["TypeScript", "JavaScript"].includes(repo.primaryLanguage?.name);
        const bundle_size = isJS ? await getBundleSize(repo.name) : null;

        return {
          name: repo.name,
          full_name: fullName,
          description: description,
          url: repo.url,
          stars: repo.stargazerCount,
          forks_count: repo.forkCount || 0,
          open_issues_count: repo.openIssues?.totalCount || 0,
          language: repo.primaryLanguage ? repo.primaryLanguage.name : "Plain Text",
          gem_score: score,
          momentum_trend: Math.round(momentumTrend * 100) / 100,
          recent_commits: w1,
          merged_prs_count: mergedPrsCount,
          topics: topics,
          activity: activity,
          good_first_issues_url: `${repo.url}/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22`,
          has_good_first_issues: hasGoodFirstIssues,
          pushed_at: repo.pushedAt,
          is_hype: isHype(repo),
          license: repo.licenseInfo?.spdxId,
          latest_release: repo.latestRelease ? {
            tag: repo.latestRelease.tagName,
            published_at: repo.latestRelease.publishedAt
          } : null,
          featured: featured,
          maintenance_score: maintenance_score,
          bundle_size: bundle_size,
          is_verified: Math.random() > 0.9 // Mock verification logic
        };
      } catch (err) {
        console.error(`Error processing repo ${repo.name}:`, err.message);
        return null;
      }
    }));

  const filteredScoredRepos = scoredRepos.filter(Boolean);

  // Sort and Diversity Filter
  const sortedGems = filteredScoredRepos.sort((a, b) => b.gem_score - a.gem_score);
  
  const finalGems = [];
  let hypeCount = 0;
  const HYPE_LIMIT = 75; // Max 30% of 250
  const TOTAL_LIMIT = 250;

  for (const gem of sortedGems) {
    if (finalGems.length >= TOTAL_LIMIT) break;
    
    if (gem.is_hype) {
      if (hypeCount < HYPE_LIMIT) {
        finalGems.push(gem);
        hypeCount++;
      }
    } else {
      finalGems.push(gem);
    }
  }

  const output = {
    last_mined: new Date().toISOString(),
    count: finalGems.length,
    gems: finalGems
  };

  const outputPath = path.join(__dirname, "../public/gems.json");
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`Successfully mined ${finalGems.length} gems (Hype: ${hypeCount}) and saved to public/gems.json`);
}

module.exports = { calculateScore, isLikelyChurn, isHype, calculateMaintenanceScore };

if (require.main === module) {
  if (!GITHUB_TOKEN) {
    console.error("GITHUB_TOKEN is required");
    process.exit(1);
  }
  getGems();
}
