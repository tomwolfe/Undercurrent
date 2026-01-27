import { describe, it, expect } from "vitest";
const { calculateScore, Classifier } = require("./miner.js");

describe("calculateScore logic", () => {
  it("higher recent commits should increase score but with diminishing returns", () => {
    const repo = {
      stargazerCount: 1000,
      createdAt: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 year old
      primaryLanguage: { name: "Rust" }
    };
    
    const scoreLow = calculateScore(repo, 5, 0, false, false);
    const scoreHigh = calculateScore(repo, 20, 0, false, false);
    const scoreVeryHigh = calculateScore(repo, 1000, 0, false, false);
    
    expect(scoreHigh).toBeGreaterThan(scoreLow);
    // Check diminishing returns: 20->1000 is 50x commits, but score shouldn't be 50x
    expect(scoreVeryHigh).toBeLessThan(scoreHigh * 5);
  });

  it("higher stars should decrease score (visibility penalty)", () => {
    const repoLowStars = {
      stargazerCount: 200,
      createdAt: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    const repoHighStars = {
      stargazerCount: 2000,
      createdAt: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    const scoreLowStars = calculateScore(repoLowStars, 10, 0, false, false);
    const scoreHighStars = calculateScore(repoHighStars, 10, 0, false, false);
    
    expect(scoreLowStars).toBeGreaterThan(scoreHighStars);
  });

  it("good first issues should boost score", () => {
    const repo = {
      stargazerCount: 500,
      createdAt: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    const scoreWithout = calculateScore(repo, 10, 0, false, false);
    const scoreWith = calculateScore(repo, 10, 0, true, false);
    
    expect(scoreWith).toBeGreaterThan(scoreWithout);
  });

  it("contributing.md should boost score by roughly 10%", () => {
    const repo = {
      stargazerCount: 500,
      createdAt: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    const scoreWithout = calculateScore(repo, 10, 0, false, false);
    const scoreWith = calculateScore(repo, 10, 0, false, true);
    
    expect(scoreWith).toBeGreaterThan(scoreWithout * 1.09);
    expect(scoreWith).toBeLessThan(scoreWithout * 1.25);
  });
});

describe("Classifier logic", () => {
  it("should detect churn by keywords", () => {
    const repo = { name: "awesome-list", description: "a collection of things" };
    expect(Classifier.isLikelyChurn(repo)).toBe(true);
  });

  it("should detect bot-inflated hype", () => {
    const repo = {
      name: "legit-tool",
      description: "some tool",
      stargazerCount: 2000,
      mentionableUsers: { totalCount: 3 }
    };
    expect(Classifier.isHype(repo)).toBe(true);
  });

  it("should not flag active small repos as bot-inflated", () => {
    const repo = {
      name: "small-tool",
      description: "some tool",
      stargazerCount: 500,
      mentionableUsers: { totalCount: 3 }
    };
    expect(Classifier.isHype(repo)).toBe(false);
  });

  it("should detect hype by keywords", () => {
    const repo = { name: "my-ai-tool", description: "using llm" };
    expect(Classifier.isHype(repo)).toBe(true);
  });
});