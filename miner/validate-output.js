const { z } = require("zod");
const fs = require("fs");
const path = require("path");

const GemSchema = z.object({
  name: z.string(),
  full_name: z.string(),
  description: z.string().nullable(),
  url: z.string().url(),
  stars: z.number().nonnegative(),
  forks_count: z.number().nonnegative(),
  open_issues_count: z.number().nonnegative(),
  language: z.string(),
  gem_score: z.number(),
  momentum_trend: z.number(),
  recent_commits: z.number().nonnegative(),
  merged_prs_count: z.number().nonnegative(),
  topics: z.array(z.string()),
  activity: z.array(z.number()).length(4),
  good_first_issues_url: z.string().url(),
  has_good_first_issues: z.boolean(),
  pushed_at: z.string(),
  is_hype: z.boolean(),
  license: z.string().optional(),
  latest_release: z.object({
    tag: z.string(),
    published_at: z.string()
  }).nullable()
});

const GemsResponseSchema = z.object({
  last_mined: z.string(),
  count: z.number().nonnegative(),
  gems: z.array(GemSchema)
});

function validateGems() {
  const gemsPath = path.join(__dirname, "../public/gems.json");
  
  if (!fs.existsSync(gemsPath)) {
    console.error("Error: gems.json not found at", gemsPath);
    process.exit(1);
  }

  try {
    const data = JSON.parse(fs.readFileSync(gemsPath, "utf8"));
    GemsResponseSchema.parse(data);
    console.log("Validation successful: gems.json matches the expected schema.");
    
    if (data.gems.length !== data.count) {
      console.error(`Warning: gems.json count (${data.count}) does not match actual gems array length (${data.gems.length}).`);
      process.exit(1);
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation failed: gems.json does not match the schema.");
      error.issues.forEach(issue => {
        console.error(`- [${issue.path.join(".")}] ${issue.message}`);
      });
    } else {
      console.error("An error occurred during validation:", error.message);
    }
    process.exit(1);
  }
}

validateGems();
