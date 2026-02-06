import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { GemCard } from "../components/GemCard";
import { Gem } from "../types";

// Mock framer-motion to avoid issues in test environment
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock Sparkline component
vi.mock("../components/Sparkline", () => ({
  Sparkline: () => <div data-testid="sparkline" />,
}));

const mockGem: Gem = {
  name: "test-repo",
  full_name: "owner/test-repo",
  description: "A test repository description",
  url: "https://github.com/owner/test-repo",
  stars: 1500,
  forks_count: 120,
  open_issues_count: 5,
  language: "TypeScript",
  gem_score: 85,
  momentum_trend: 1.6,
  recent_commits: 10,
  merged_prs_count: 5,
  topics: ["react", "typescript"],
  activity: [1, 2, 3, 4],
  good_first_issues_url: "https://github.com/owner/test-repo/issues",
  has_good_first_issues: true,
  pushed_at: new Date().toISOString(),
  is_hype: false,
};

test("GemCard renders repository name and star count correctly", () => {
  render(<GemCard gem={mockGem} now={Date.now()} />);
  
  // Check if repository name is rendered
  expect(screen.getByText("test-repo")).toBeDefined();
  
  // Check if star count is rendered (1500 -> 1.5k)
  expect(screen.getByText("1.5k")).toBeDefined();
  
  // Check if high momentum badge is rendered (trend 1.6 > 1.5)
  expect(screen.getByText("HIGH MOMENTUM")).toBeDefined();
});
