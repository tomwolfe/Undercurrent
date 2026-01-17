/* eslint-disable @typescript-eslint/no-require-imports */
const { graphql } = require("@octokit/graphql");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error("GITHUB_TOKEN is required");
  process.exit(1);
}

const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${GITHUB_TOKEN}`,
  },
});

async function getGems() {
  const now = new Date();
  const sixMonthsAgo = new Date(new Date().setMonth(now.getMonth() - 6)).toISOString().split('T')[0];
  const sevenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 7)).toISOString();
  const fourteenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 14)).toISOString();
  const twentyOneDaysAgo = new Date(new Date().setDate(new Date().getDate() - 21)).toISOString();
  const twentyEightDaysAgo = new Date(new Date().setDate(new Date().getDate() - 28)).toISOString();

  const query = `
    query($searchQuery: String!) {
      search(query: $searchQuery, type: REPOSITORY, first: 100) {
        edges {
          node {
            ... on Repository {
              name
              owner {
                login
              }
              description
              url
              stargazerCount
              createdAt
              pushedAt
              primaryLanguage {
                name
              }
              defaultBranchRef {
                target {
                  ... on Commit {
                    w1: history(since: "${sevenDaysAgo}") { totalCount }
                    w2: history(since: "${fourteenDaysAgo}", until: "${sevenDaysAgo}") { totalCount }
                    w3: history(since: "${twentyOneDaysAgo}", until: "${fourteenDaysAgo}") { totalCount }
                    w4: history(since: "${twentyEightDaysAgo}", until: "${twentyOneDaysAgo}") { totalCount }
                  }
                }
              }
              issues(states: OPEN, labels: ["good first issue"], first: 1) {
                totalCount
              }
              labeledIssues: issues(states: OPEN, filterBy: { hasLabels: true }) {
                totalCount
              }
            }
          }
        }
      }
    }
  `;

  // Search criteria: Stars 100-3000, Created > 6 months ago, Pushed > 7 days ago
  const searchQuery = `stars:100..3000 created:<${sixMonthsAgo} pushed:>${new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]} sort:updated-desc`;

  try {
    const result = await graphqlWithAuth(query, { searchQuery });
    const repos = result.search.edges.map(edge => edge.node);

    const scoredRepos = repos.map(repo => {
      const stars = repo.stargazerCount || 1;
      const w1 = repo.defaultBranchRef?.target?.w1?.totalCount || 0;
      const w2 = repo.defaultBranchRef?.target?.w2?.totalCount || 0;
      const w3 = repo.defaultBranchRef?.target?.w3?.totalCount || 0;
      const w4 = repo.defaultBranchRef?.target?.w4?.totalCount || 0;
      
      const activity = [w4, w3, w2, w1]; // Past to present
      const recentCommits = w1;
      const labeledIssuesCount = repo.labeledIssues?.totalCount || 0;
      
      const createdAt = new Date(repo.createdAt);
      const ageInMonths = Math.max(1, (new Date() - createdAt) / (1000 * 60 * 60 * 24 * 30.44));
      
      // Score = (Recent_Commits * 10) + (Open_Issues_with_Labels * 5) / (log10(Stars) * Repo_Age_In_Months)
      // Following spec's implied grouping for a meaningful score
      const score = ((recentCommits * 10) + (labeledIssuesCount * 5)) / (Math.log10(stars) * ageInMonths);

      return {
        name: repo.name,
        full_name: `${repo.owner.login}/${repo.name}`,
        description: repo.description,
        url: repo.url,
        stars: stars,
        language: repo.primaryLanguage ? repo.primaryLanguage.name : "Plain Text",
        gem_score: Math.round(score * 100) / 100,
        recent_commits: recentCommits,
        activity: activity,
        good_first_issues_url: `${repo.url}/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22`,
        has_good_first_issues: repo.issues.totalCount > 0,
        pushed_at: repo.pushedAt
      };
    });

    // Sort by score and take top 100
    const topGems = scoredRepos
      .sort((a, b) => b.gem_score - a.gem_score)
      .slice(0, 100);

    const output = {
      last_mined: new Date().toISOString(),
      count: topGems.length,
      gems: topGems
    };

    const outputPath = path.join(__dirname, "../public/gems.json");
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`Successfully mined ${topGems.length} gems and saved to public/gems.json`);

  } catch (error) {
    console.error("Error fetching gems:", error);
  }
}

getGems();
