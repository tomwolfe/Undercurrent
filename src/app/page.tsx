"use client";

import { useState, useEffect, useMemo } from "react";
import { Gem, GemCard } from "@/components/GemCard";
import { Search, Filter, Sparkles, Zap, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [gems, setGems] = useState<Gem[]>([]);
  const [loading, setLoading] = useState(true);
  const [noHype, setNoHype] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"score" | "recent" | "stars">("score");
  const [searchQuery, setSearchQuery] = useState("");
  const [now, setNow] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
  }, []);

  useEffect(() => {
    const GEMS_URL = "https://raw.githubusercontent.com/tomwolfe/Undercurrent/main/public/gems.json";
    fetch(GEMS_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch from Raw URL");
        return res.json();
      })
      .catch(() => {
        // Fallback to local if raw URL fails
        return fetch("/gems.json").then(res => res.json());
      })
      .then((data) => {
        setGems(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch gems:", err);
        setLoading(false);
      });
  }, []);

  const languages = useMemo(() => {
    const langs = new Set(gems.map((g) => g.language));
    return ["All", ...Array.from(langs).filter(Boolean)].sort();
  }, [gems]);

  const filteredGems = useMemo(() => {
    return gems
      .filter((gem) => {
        if (noHype) {
          const desc = (gem.description || "").toLowerCase();
          const name = gem.name.toLowerCase();
          const hypeWords = ["ai", "llm", "gpt", "openai", "claude", "langchain", "agent"];
          if (hypeWords.some(word => desc.includes(word) || name.includes(word))) {
            return false;
          }
        }
        if (selectedLanguage !== "All" && gem.language !== selectedLanguage) {
          return false;
        }
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            gem.name.toLowerCase().includes(query) ||
            (gem.description || "").toLowerCase().includes(query) ||
            gem.language.toLowerCase().includes(query)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "score") return b.gem_score - a.gem_score;
        if (sortBy === "recent") return new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();
        if (sortBy === "stars") return a.stars - b.stars;
        return 0;
      });
  }, [gems, noHype, selectedLanguage, sortBy, searchQuery]);

  return (
    <main className="min-h-screen bg-[#030303] text-white selection:bg-blue-500/30">
      {/* Header */}
      <div className="relative border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                  <Zap size={20} className="fill-white text-white" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Undercurrent</h1>
              </div>
              <p className="text-sm text-white/40">Discover hidden engineering gems on GitHub.</p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {/* Search Bar */}
              <div className="relative min-w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                <input
                  type="text"
                  placeholder="Search gems, topics, or languages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full bg-white/5 border border-white/10 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setNoHype(!noHype)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all border",
                    noHype 
                      ? "bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
                      : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                  )}
                >
                  <Sparkles size={14} className={noHype ? "fill-current" : ""} />
                  No-Hype Mode
                </button>
                
                <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />

                <div className="flex items-center gap-1 rounded-full bg-white/5 p-1 border border-white/5">
                  {(["score", "recent", "stars"] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => setSortBy(option)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium capitalize transition-all",
                        sortBy === option ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            <Filter size={14} className="text-white/40 shrink-0" />
            <div className="flex gap-2">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={cn(
                    "whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-all border",
                    selectedLanguage === lang 
                      ? "bg-white/10 border-white/20 text-white" 
                      : "bg-transparent border-white/5 text-white/40 hover:border-white/10 hover:text-white/60"
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          </div>
        ) : filteredGems.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredGems.map((gem) => (
              <GemCard key={gem.full_name} gem={gem} now={now} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Info size={40} className="text-white/10 mb-4" />
            <h3 className="text-lg font-medium text-white/60">No gems found</h3>
            <p className="text-sm text-white/40">Try adjusting your filters or disabling No-Hype mode.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 mt-12">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-white/20">
            Powered by Undercurrent Miner. Updates every 12 hours.
          </p>
          <div className="flex gap-6 text-sm text-white/20">
            <a href="https://github.com/tom/Undercurrent" className="hover:text-white/40 transition-colors">Source</a>
            <a href="#" className="hover:text-white/40 transition-colors">Methodology</a>
          </div>
        </div>
      </footer>
    </main>
  );
}