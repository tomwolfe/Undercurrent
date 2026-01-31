// Shared types for the Undercurrent project

export interface Gem {

  name: string;

  full_name: string;

  description: string;

  url: string;

  stars: number;

  forks_count: number;

  open_issues_count: number;

  language: string;

  gem_score: number;

  momentum_trend: number;

  recent_commits: number;

  activity: number[]; // [week4, week3, week2, week1] - oldest to newest

  good_first_issues_url: string;

  has_good_first_issues: boolean;

  pushed_at: string;

  is_hype: boolean;
  merged_prs_count: number;
  topics: string[];
  license?: string;
  latest_release?: {

    tag: string;

    published_at: string;

  };

}



export interface GemsResponse {

  last_mined: string;

  count: number;

  gems: Gem[];

}



export type SortOption = "score" | "recent" | "stars" | "saved";

export type LanguageFilter = string;
