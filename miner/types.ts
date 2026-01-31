export interface Repository {
  name: string;
  owner: {
    login: string;
  };
  description: string | null;
  url: string;
  stargazerCount: number;
  createdAt: string;
  pushedAt: string;
  primaryLanguage: {
    name: string;
  } | null;
  licenseInfo: {
    spdxId: string;
  } | null;
  repositoryTopics: {
    nodes: Array<{
      topic: {
        name: string;
      };
    }>;
  };
  mergedPrs: {
    nodes: Array<{
      mergedAt: string;
    }>;
  };
  latestRelease: {
    tagName: string;
    publishedAt: string;
  } | null;
  defaultBranchRef: {
    target: {
      w1: { totalCount: number };
      w2: { totalCount: number };
      w3: { totalCount: number };
      w4: { totalCount: number };
    };
  } | null;
  issues: {
    totalCount: number;
  };
  openIssues: {
    totalCount: number;
  };
  forkCount: number;
  repositoryLabels: {
    totalCount: number;
  };
}

export interface ScoredGem {
  name: string;
  full_name: string;
  description: string | null;
  url: string;
  stars: number;
  forks_count: number;
  open_issues_count: number;
  language: string;
  gem_score: number;
  momentum_trend: number;
  recent_commits: number;
  merged_prs_count: number;
  topics: string[];
  activity: number[];
  good_first_issues_url: string;
  has_good_first_issues: boolean;
  pushed_at: string;
  is_hype: boolean;
  license?: string;
  latest_release: {
    tag: string;
    published_at: string;
  } | null;
}

export interface MiningConfig {
  targetLanguages: string[];
  churnKeywords: string[];
  hypeKeywords: string[];
  hypeLimit: number;
  totalLimit: number;
  maxPages: number;
}

export interface GemsResponse {
  last_mined: string;
  count: number;
  gems: ScoredGem[];
}
