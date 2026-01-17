# Undercurrent - GitHub Hidden Gems Discovery

Undercurrent is an automated discovery engine that finds high-quality, low-star repositories on GitHub. Think of it as a "Product Hunt for Code" that surfaces hidden gems before they become mainstream.

## Overview

The project consists of two main components:

1. **Miner** - A Node.js script that runs via GitHub Actions to discover and score repositories
2. **Explorer** - A Next.js frontend that displays the discovered gems

## Features

- **Automated Discovery**: Finds repositories created >6 months ago, with 100-3000 stars, recently active
- **Custom Scoring Algorithm**: Scores repos based on activity, contribution-friendliness, and visibility
- **Masonry Grid Layout**: Beautiful responsive layout for gem cards
- **Advanced Filtering**: Language filters, sort options, and "No-Hype" mode
- **Contribution Pathways**: Direct links to "Good First Issues" for each repository

## Architecture

### Scoring Algorithm

The gem scoring formula is:
```
score = (Recent_Commits * 10) + (Open_Issues_with_Labels * 5) / (log10(Stars) * Repo_Age_In_Months)
```

This rewards:
- Active development (commits)
- Contribution-friendly projects (labeled issues)
- Underrated projects (lower stars normalized by log10)
- Mature projects (age factor)

### Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, Framer Motion for animations
- **UI Components**: Shadcn/UI
- **Icons**: Lucide React
- **Data Mining**: GitHub GraphQL API via Octokit
- **Deployment**: Optimized for Vercel

## Local Development

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Setting Up the Explorer (Frontend)

1. Clone the repository:
```bash
git clone https://github.com/your-username/undercurrent.git
cd undercurrent
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) to view the explorer

### Setting Up the Miner (Data Mining)

1. Navigate to the miner directory:
```bash
cd miner
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your GitHub token:
```bash
echo "GITHUB_TOKEN=your_github_token_here" > .env
```

> **Note**: Your GitHub token needs public_repo permissions to access repository data.

4. Run the miner script:
```bash
node miner.js
```

This will generate a `public/gems.json` file with the discovered gems.

## Configuration

### Miner Configuration

The miner script (`miner/miner.js`) can be configured by modifying:

- **Time filters**: Repository age, recency of commits
- **Star count range**: Minimum and maximum star thresholds
- **Scoring weights**: Adjust the importance of commits vs. labeled issues

### GitHub Actions

The mining process runs automatically via GitHub Actions (`.github/workflows/mine.yml`) every 12 hours. The workflow:

1. Checks out the repository
2. Sets up Node.js
3. Runs the miner script
4. Commits the updated `gems.json` back to the repository

## Deployment

### Vercel (Recommended)

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/undercurrent)

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. The application will fetch `gems.json` directly from the GitHub raw URL, so no rebuild is needed when new gems are mined.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

MIT
