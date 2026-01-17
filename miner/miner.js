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
  const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6)).toISOString().split('T')[0];
  const sevenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0];

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
                    history(since: "${new Date(new Date().setDate(new Date().getDate() - 7)).toISOString()}") {
                      totalCount
                    }
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
  const searchQuery = `stars:100..3000 created:<${sixMonthsAgo} pushed:>${sevenDaysAgo} sort:updated-desc`;

  try {
    const result = await graphqlWithAuth(query, { searchQuery });
    const repos = result.search.edges.map(edge => edge.node);

    const scoredRepos = repos.map(repo => {
      const stars = repo.stargazerCount || 1;
      const recentCommits = repo.defaultBranchRef?.target?.history?.totalCount || 0;
      const labeledIssuesCount = repo.labeledIssues?.totalCount || 0;
      const createdAt = new Date(repo.createdAt);
      const ageInMonths = Math.max(1, Math.floor((new Date() - createdAt) / (1000 * 60 * 60 * 24 * 30.44)));
      
      // Score = ((Recent_Commits * 10) + (Open_Issues_with_Labels * 5)) / (log10(Stars) * Repo_Age_In_Months)
      const score = ((recentCommits * 10) + (labeledIssuesCount * 5)) / (Math.log10(stars) * ageInMonths);

      return {
        name: repo.name,
        full_name: `${repo.owner.login}/${repo.name}`,
        description: repo.description,
        url: repo.url,
        stars: stars,
        language: repo.primaryLanguage ? repo.primaryLanguage.name : "Unknown",
        gem_score: parseFloat(score.toFixed(2)),
        recent_commits: recentCommits,
        good_first_issues_url: `${repo.url}/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22`,
        has_good_first_issues: repo.issues.totalCount > 0,
        pushed_at: repo.pushedAt
      };
    });

    // Sort by score and take top 100
    const topGems = scoredRepos
      .sort((a, b) => b.gem_score - a.gem_score)
      .slice(0, 100);

    const outputPath = path.join(__dirname, "../public/gems.json");
    fs.writeFileSync(outputPath, JSON.stringify(topGems, null, 2));
    console.log(`Successfully mined ${topGems.length} gems and saved to public/gems.json`);

  } catch (error) {
    console.error("Error fetching gems:", error);
  }
}

getGems();
