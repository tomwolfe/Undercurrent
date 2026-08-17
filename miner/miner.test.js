const assert = require("node:assert");
const test = require("node:test");
const { calculateScore, isLikelyChurn, isHype, calculateMaintenanceScore, isLikelySpam } = require("./miner.js");

test("calculateMaintenanceScore logic", async (t) => {
  await t.test("should return 0 for just merged PR", () => {
    const now = new Date().toISOString();
    assert.strictEqual(calculateMaintenanceScore(now), 0);
  });

  await t.test("should return correct number of days for older merge", () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    assert.strictEqual(calculateMaintenanceScore(tenDaysAgo), 10);
  });

  await t.test("should return 999 if no merge date provided", () => {
    assert.strictEqual(calculateMaintenanceScore(null), 999);
  });
});

test("calculateScore logic", async (t) => {
  await t.test("higher recent commits should increase score but with diminishing returns", () => {
    const repo = {
      stargazerCount: 1000,
      createdAt: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 year old
      primaryLanguage: { name: "Rust" }
    };
    
    const scoreLow = calculateScore(repo, 5, 0, 0, false);
    const scoreHigh = calculateScore(repo, 20, 0, 0, false);
    const scoreVeryHigh = calculateScore(repo, 1000, 0, 0, false);
    
    assert.ok(scoreHigh > scoreLow, `Expected ${scoreHigh} to be greater than ${scoreLow}`);
    // Check diminishing returns: 20->1000 is 50x commits, but score shouldn't be 50x
    assert.ok(scoreVeryHigh < scoreHigh * 5, "Score grew too much for 50x commits");
  });

  await t.test("higher merged PRs should increase score", () => {
    const repo = {
      stargazerCount: 1000,
      createdAt: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    const scoreLowPRs = calculateScore(repo, 10, 1, 0, false);
    const scoreHighPRs = calculateScore(repo, 10, 10, 0, false);
    
    assert.ok(scoreHighPRs > scoreLowPRs, `Expected ${scoreHighPRs} to be greater than ${scoreLowPRs}`);
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
    
    const scoreLowStars = calculateScore(repoLowStars, 10, 0, 0, false);
    const scoreHighStars = calculateScore(repoHighStars, 10, 0, 0, false);
    
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
    
    const scoreRust = calculateScore(repoRust, 10, 0, 0, false);
    const scorePlainText = calculateScore(repoPlainText, 10, 0, 0, false);
    
    assert.ok(scoreRust > scorePlainText, `Expected Rust (${scoreRust}) to outscore Plain Text (${scorePlainText})`);
  });

  await t.test("good first issues should boost score", () => {
    const repo = {
      stargazerCount: 500,
      createdAt: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    const scoreWithout = calculateScore(repo, 10, 0, 0, false);
    const scoreWith = calculateScore(repo, 10, 0, 0, true);
    
    assert.ok(scoreWith > scoreWithout, "Good first issues should boost score");
  });

  await t.test("edge case: stars=0 should not result in Infinity or NaN", () => {
    const repo = {
      stargazerCount: 0,
      createdAt: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    const score = calculateScore(repo, 10, 0, 0, false);
    assert.ok(Number.isFinite(score), `Score ${score} should be finite`);
    assert.ok(!Number.isNaN(score), "Score should not be NaN");
  });

  await t.test("edge case: repo_age=0 should not result in Infinity or NaN", () => {
    const repo = {
      stargazerCount: 1000,
      createdAt: new Date().toISOString(), // 0 days old
    };
    const score = calculateScore(repo, 10, 0, 0, false);
    assert.ok(Number.isFinite(score), `Score ${score} should be finite`);
    assert.ok(!Number.isNaN(score), "Score should not be NaN");
  });
});

test("isLikelyChurn logic", async (t) => {
  await t.test("should identify churn keywords in name", () => {
    assert.strictEqual(isLikelyChurn({ name: "my-proxy-list", description: "" }), true);
    assert.strictEqual(isLikelyChurn({ name: "awesome-thing", description: "" }), false);
  });

  await t.test("should identify churn keywords in description", () => {
    assert.strictEqual(isLikelyChurn({ name: "repo", description: "A list of blocklist rules" }), true);
  });

  await t.test("should identify automated date patterns in name", () => {
    assert.strictEqual(isLikelyChurn({ name: "update-2023-10-01", description: "" }), true);
  });
});

test("isLikelySpam logic", async (t) => {
  await t.test("should detect bot repo: maintenance_score 999, 0 PRs, 0 issues", () => {
    const repo = {
      name: "test-bot",
      description: "just a test",
      stargazerCount: 100,
      createdAt: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      primaryLanguage: { name: "Plain Text" }
    };
    // Mock isLikelySpam conditions
    assert.strictEqual(isLikelySpam(repo, 999, 0, 0), true, "Bot repo should be dropped");
  });

  await t.test("should not flag repo with activity", () => {
    const repo = {
      name: "active-repo",
      description: "An active project",
      stargazerCount: 500,
      createdAt: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      primaryLanguage: { name: "Rust" }
    };
    assert.strictEqual(isLikelySpam(repo, 10, 5, 10), false, "Active repo should not be flagged");
  });

  await t.test("should detect keyword-stuffed description > 300 chars", () => {
    const repo = {
      name: "repo",
      description: "A".repeat(350),
      stargazerCount: 100,
      createdAt: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      primaryLanguage: { name: "Plain Text" }
    };
    assert.strictEqual(isLikelySpam(repo, 999, 0, 0), true, "Long description should be flagged");
  });

  await t.test("should not flag short descriptions", () => {
    const repo = {
      name: "repo",
      description: "A short description",
      stargazerCount: 100,
      createdAt: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      primaryLanguage: { name: "Plain Text" }
    };
    assert.strictEqual(isLikelySpam(repo, 10, 0, 0), false, "Short description with activity should not be flagged");
  });
});