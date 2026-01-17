const assert = require("node:assert");
const test = require("node:test");
const { calculateScore } = require("./miner.js");

test("calculateScore logic", async (t) => {
  await t.test("higher recent commits should increase score but with diminishing returns", () => {
    const repo = {
      stargazerCount: 1000,
      createdAt: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 year old
      primaryLanguage: { name: "Rust" }
    };
    
    const scoreLow = calculateScore(repo, 5, 0, false);
    const scoreHigh = calculateScore(repo, 20, 0, false);
    const scoreVeryHigh = calculateScore(repo, 1000, 0, false);
    
    assert.ok(scoreHigh > scoreLow, `Expected ${scoreHigh} to be greater than ${scoreLow}`);
    // Check diminishing returns: 20->1000 is 50x commits, but score shouldn't be 50x
    assert.ok(scoreVeryHigh < scoreHigh * 5, "Score grew too much for 50x commits");
  });

  await t.test("higher stars should decrease score (visibility penalty)", () => {
    const repoLowStars = {
      stargazerCount: 200,
      createdAt: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    const repoHighStars = {
      stargazerCount: 2000,
      createdAt: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    const scoreLowStars = calculateScore(repoLowStars, 10, 0, false);
    const scoreHighStars = calculateScore(repoHighStars, 10, 0, false);
    
    assert.ok(scoreLowStars > scoreHighStars, `Expected ${scoreLowStars} to be greater than ${scoreHighStars}`);
  });

  await t.test("targeted languages should have higher scores", () => {
    const repoRust = {
      stargazerCount: 500,
      createdAt: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      primaryLanguage: { name: "Rust" }
    };
    const repoPlainText = {
      stargazerCount: 500,
      createdAt: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      primaryLanguage: { name: "Plain Text" }
    };
    
    const scoreRust = calculateScore(repoRust, 10, 0, false);
    const scorePlainText = calculateScore(repoPlainText, 10, 0, false);
    
    assert.ok(scoreRust > scorePlainText, `Expected Rust (${scoreRust}) to outscore Plain Text (${scorePlainText})`);
  });

  await t.test("good first issues should boost score", () => {
    const repo = {
      stargazerCount: 500,
      createdAt: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    const scoreWithout = calculateScore(repo, 10, 0, false);
    const scoreWith = calculateScore(repo, 10, 0, true);
    
    assert.ok(scoreWith > scoreWithout, "Good first issues should boost score");
  });
});
