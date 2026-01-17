import { Explorer } from "@/components/Explorer";
import { GemsResponse } from "@/types";
import localGems from "../../public/gems.json";
import { Suspense } from "react";

// Revalidate every 6 hours (mined every 12 hours)
export const revalidate = 21600;

async function getGems(): Promise<GemsResponse> {
  const GEMS_URL = process.env.NEXT_PUBLIC_GEMS_URL || "https://raw.githubusercontent.com/tomwolfe/Undercurrent/main/public/gems.json";
  
  const processData = (data: any): GemsResponse => {
    if (Array.isArray(data)) {
      return {
        last_mined: new Date().toISOString(),
        count: data.length,
        gems: data
      };
    }
    return data as GemsResponse;
  };

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
    console.error("Error fetching gems in Server Component:", error);
    // Fallback to imported local JSON
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
