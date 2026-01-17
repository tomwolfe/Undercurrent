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

function calculateScore(repo, recentCommits, labeledIssuesCount) {
  const stars = Math.max(1, repo.stargazerCount);
  const createdAt = new Date(repo.createdAt);
  const ageInMonths = Math.max(6, (new Date() - createdAt) / (1000 * 60 * 60 * 24 * 30.44));

  // Score components
  // 1. Momentum: Recent commits are very important
  const momentum = recentCommits * 15;
  
  // 2. Contribution: Labeled issues show maintainer openness
  const contribution = labeledIssuesCount * 8;
  
  // 3. Visibility Penalty: We want hidden gems, so higher stars decrease the score slightly
  // Using log10 to make the penalty non-linear
  const visibilityFactor = Math.log10(stars);
  
  // 4. Maturity: Age provides a base stability factor
  const maturityFactor = Math.sqrt(ageInMonths);

  // Final formula: (Momentum + Contribution) / (Visibility * Maturity)
  // We multiply by 10 to get a nicer range (0-100+)
  const rawScore = ((momentum + contribution + 10) / (visibilityFactor * maturityFactor)) * 5;
  
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

  const scoredRepos = Array.from(allRepos.values()).map(repo => {
    try {
      const w1 = repo.defaultBranchRef?.target?.w1?.totalCount || 0;
      const w2 = repo.defaultBranchRef?.target?.w2?.totalCount || 0;
      const w3 = repo.defaultBranchRef?.target?.w3?.totalCount || 0;
      const w4 = repo.defaultBranchRef?.target?.w4?.totalCount || 0;

      const activity = [w4, w3, w2, w1];
      const avgActivity = (w2 + w3 + w4) / 3;
      const momentumTrend = avgActivity === 0 ? (w1 > 0 ? 1 : 0) : (w1 / avgActivity);

      const labeledIssuesCount = repo.repositoryLabels?.totalCount || 0;
      const score = calculateScore(repo, w1, labeledIssuesCount);

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
        has_good_first_issues: repo.issues.totalCount > 0,
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