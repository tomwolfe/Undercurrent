const assert = require("node:assert");
const test = require("node:test");
const { calculateScore } = require("./miner.js");

test("calculateScore logic", async (t) => {
  await t.test("higher recent commits should increase score", () => {
    const repo = {
      stargazerCount: 1000,
      createdAt: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 year old
    };
    
    const scoreLow = calculateScore(repo, 5, 0);
    const scoreHigh = calculateScore(repo, 20, 0);
    
    assert.ok(scoreHigh > scoreLow, `Expected ${scoreHigh} to be greater than ${scoreLow}`);
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
    
    const scoreLowStars = calculateScore(repoLowStars, 10, 0);
    const scoreHighStars = calculateScore(repoHighStars, 10, 0);
    
    assert.ok(scoreLowStars > scoreHighStars, `Expected ${scoreLowStars} to be greater than ${scoreHighStars}`);
  });

  await t.test("older repos should have a slightly lower score (maturity factor divider)", () => {
    const repoYoung = {
      stargazerCount: 500,
      createdAt: new Date(Date.now() - 7 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 7 months old
    };
    const repoOld = {
      stargazerCount: 500,
      createdAt: new Date(Date.now() - 36 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 3 years old
    };
    
    const scoreYoung = calculateScore(repoYoung, 10, 0);
    const scoreOld = calculateScore(repoOld, 10, 0);
    
    assert.ok(scoreYoung > scoreOld, `Expected ${scoreYoung} to be greater than ${scoreOld}`);
  });
});
