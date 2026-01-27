import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await params;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers: {
        "Accept": "application/vnd.github.v3.raw",
        ...(GITHUB_TOKEN ? { "Authorization": `token ${GITHUB_TOKEN}` } : {}),
      },
      next: {
        revalidate: 3600, // Cache for 1 hour
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ content: "README not found." }, { status: 404 });
      }
      throw new Error(`GitHub API responded with ${response.status}`);
    }

    const content = await response.text();
    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error fetching README:", error);
    return NextResponse.json({ error: "Failed to fetch README" }, { status: 500 });
  }
}
