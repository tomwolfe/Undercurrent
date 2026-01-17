import { Explorer } from "@/components/Explorer";
import { GemsResponse } from "@/types";
import localGems from "../../public/gems.json";
import { Suspense } from "react";
import fs from "fs";
import path from "path";

// Revalidate every 6 hours (mined every 12 hours)
export const revalidate = 21600;

async function getGems(): Promise<GemsResponse> {
  const GEMS_URL = process.env.NEXT_PUBLIC_GEMS_URL;
  
  const processData = (data: unknown): GemsResponse => {
    if (Array.isArray(data)) {
      return {
        last_mined: new Date().toISOString(),
        count: data.length,
        gems: data as Gem[]
      };
    }
    return data as GemsResponse;
  };

  // If a URL is explicitly provided, fetch from it
  if (GEMS_URL) {
    try {
      const response = await fetch(`${GEMS_URL}?t=${Date.now()}`, {
        next: { revalidate: 21600 }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch gems from ${GEMS_URL}`);
      }
      
      const data = await response.json();
      return processData(data);
    } catch (error) {
      console.error("Error fetching gems:", error);
      return processData(localGems);
    }
  }

  // Otherwise, default to the local filesystem for immediate updates
  try {
    const filePath = path.join(process.cwd(), "public", "gems.json");
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf8");
      const data = JSON.parse(fileContent);
      return processData(data);
    }
    return processData(localGems);
  } catch (error) {
    console.error("Error reading gems from filesystem:", error);
    return processData(localGems);
  }
}

export default async function Page() {
  const data = await getGems();
  
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505] flex items-center justify-center text-white/20">Loading gems...</div>}>
      <Explorer initialGems={data.gems} lastMined={data.last_mined} />
    </Suspense>
  );
}
