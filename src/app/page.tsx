"use client";

import { useState, useEffect, useMemo } from "react";
import { Gem, GemCard } from "@/components/GemCard";
import { Search, Sparkles, Zap, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const Modal = ({ title, children, isOpen, onClose }: { title: string, children: React.ReactNode, isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg rounded-2xl bg-[#0A0A0A] border border-white/10 p-8 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
          <button 
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="text-sm text-white/60 leading-relaxed space-y-4">
          {children}
        </div>
        <div className="mt-8 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-all border border-white/5"
          >
            Close
          </button>
        </div>
      </div>
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
};

export default function Home() {
  const [gems, setGems] = useState<Gem[]>([]);
  const [lastMined, setLastMined] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [noHype, setNoHype] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"score" | "recent" | "stars">("score");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
  }, []);

  useEffect(() => {
    const GEMS_URL = `https://raw.githubusercontent.com/tomwolfe/Undercurrent/main/public/gems.json?t=${Date.now()}`;
    fetch(GEMS_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch from Raw URL");
        return res.json();
      })
      .catch(() => {
        // Fallback to local if raw URL fails
        return fetch(`/gems.json?t=${Date.now()}`).then(res => res.json());
      })
      .then((data) => {
        if (data.gems) {
          setGems(data.gems);
          setLastMined(data.last_mined);
        } else {
          setGems(data); // Handle old format if necessary
        }
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
          const hypeWords = ["ai", "llm", "gpt", "openai", "claude", "langchain", "agent", "deepseek", "gemini", "llama", "mistral"];
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
    <main className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30">
      {/* Modals */}
      <Modal 
        title="Methodology" 
        isOpen={activeModal === "methodology"} 
        onClose={() => setActiveModal(null)}
      >
        <p>Undercurrent uses a custom discovery engine to find high-quality engineering projects that haven&apos;t hit the mainstream yet.</p>
        <div className="space-y-2">
          <p className="font-semibold text-white">Discovery Criteria:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Repositories created more than 6 months ago (proving stability).</li>
            <li>Star counts between 100 and 3,000 (true &quot;hidden gems&quot;).</li>
            <li>Active development with pushes within the last 7 days.</li>
          </ul>
        </div>
        <p>The engine runs every 12 hours via GitHub Actions, scanning thousands of repositories to surface the top 100 contenders.</p>
      </Modal>

      <Modal 
        title="Scoring Logic" 
        isOpen={activeModal === "scoring"} 
        onClose={() => setActiveModal(null)}
      >
        <p>Gems are ranked using a multi-factor momentum algorithm designed to highlight activity relative to visibility.</p>
        <div className="bg-white/5 p-4 rounded-xl border border-white/5 font-mono text-[10px] text-blue-400">
          score = ((Recent_Commits * 10) + (Issues_with_Labels * 5)) / (log10(Stars) * Repo_Age_Months)
        </div>
        <div className="space-y-2">
          <p className="font-semibold text-white">Weighting Factors:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><span className="text-white/90">Recent Commits:</span> High weight on immediate activity.</li>
            <li><span className="text-white/90">Labeled Issues:</span> Rewards projects with organized contribution paths.</li>
            <li><span className="text-white/90">Log10 Stars:</span> Normalizes growth so smaller projects can compete.</li>
            <li><span className="text-white/90">Age:</span> Rewards consistent long-term development.</li>
          </ul>
        </div>
      </Modal>

      <Modal 
        title="Privacy Policy" 
        isOpen={activeModal === "privacy"} 
        onClose={() => setActiveModal(null)}
      >
        <p>Undercurrent is a static, client-side application. We do not track you, we do not use cookies, and we do not store any personal data.</p>
        <p>All repository data is fetched directly from public GitHub records. Your interactions with this site are private and ephemeral.</p>
      </Modal>

      <Modal 
        title="Terms of Service" 
        isOpen={activeModal === "terms"} 
        onClose={() => setActiveModal(null)}
      >
        <p>Undercurrent is provided &quot;as is&quot; without warranty of any kind. The data is mined automatically from GitHub and may occasionally include inaccuracies.</p>
        <p>Usage of this tool is subject to GitHub&apos;s Acceptable Use Policies. Undercurrent is an open-source discovery engine and is not affiliated with GitHub, Inc.</p>
      </Modal>

      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-purple-500/5 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <div className="relative border-b border-white/[0.05] bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                <Zap size={22} className="fill-white text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                  Undercurrent
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Hidden Gem Discovery</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-500 transition-colors" size={14} />
                <input
                  type="text"
                  placeholder="Search gems..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-64 rounded-lg bg-white/[0.03] border border-white/10 py-2 pl-9 pr-4 text-xs outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all"
                />
              </div>
              
              <button
                onClick={() => setNoHype(!noHype)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all border",
                  noHype 
                    ? "bg-blue-500/10 border-blue-500/40 text-blue-400" 
                    : "bg-white/[0.03] border-white/5 text-white/40 hover:text-white/60 hover:bg-white/[0.05]"
                )}
              >
                <Sparkles size={14} className={noHype ? "fill-current" : ""} />
                <span className="hidden sm:inline">No-Hype</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="border-b border-white/[0.02] bg-black/40">
        <div className="mx-auto max-w-7xl px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-1 text-[11px] font-semibold transition-all",
                  selectedLanguage === lang 
                    ? "bg-white/10 text-white" 
                    : "text-white/30 hover:text-white/50"
                )}
              >
                {lang}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-lg border border-white/5">
            {(["score", "recent", "stars"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={cn(
                  "rounded-md px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all",
                  sortBy === option ? "bg-white/10 text-white shadow-sm" : "text-white/20 hover:text-white/40"
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 rounded-xl bg-white/[0.02] animate-pulse border border-white/5" />
            ))}
          </div>
        ) : filteredGems.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredGems.map((gem) => (
              <GemCard key={gem.full_name} gem={gem} now={now} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <div className="h-20 w-20 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6">
              <Info size={32} className="text-white/10" />
            </div>
            <h3 className="text-xl font-semibold text-white/80">Zero gems found</h3>
            <p className="text-sm text-white/30 mt-2 max-w-xs">
              The current filter combination returned no results. Try broadening your search.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] py-20 mt-20 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-blue-500" />
                <span className="font-bold tracking-tight">Undercurrent</span>
              </div>
              <p className="text-sm text-white/20 max-w-xs leading-relaxed">
                An autonomous engine discovering high-quality, low-visibility engineering projects. Updated every 12 hours.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-16">
              <div className="space-y-4">
                <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">Engine</h4>
                <ul className="space-y-2 text-sm text-white/20">
                  <li><button onClick={() => setActiveModal("methodology")} className="hover:text-blue-400 transition-colors cursor-pointer">Methodology</button></li>
                  <li><button onClick={() => setActiveModal("scoring")} className="hover:text-blue-400 transition-colors cursor-pointer">Scoring</button></li>
                  <li><a href="https://github.com/tomwolfe/Undercurrent" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">Source</a></li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white/20">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span>Operational</span>
                  </div>
                  {lastMined && (
                    <div className="text-[10px] text-white/10 uppercase tracking-wider font-medium">
                      Last Updated: {new Date(lastMined).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-white/[0.02] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] text-white/10 uppercase tracking-widest font-bold">
              © 2026 Undercurrent Engine
            </p>
            <div className="flex gap-8 text-[10px] text-white/10 uppercase tracking-widest font-bold">
              <button onClick={() => setActiveModal("privacy")} className="hover:text-white/30 transition-colors cursor-pointer uppercase text-[10px] font-bold">Privacy</button>
              <button onClick={() => setActiveModal("terms")} className="hover:text-white/30 transition-colors cursor-pointer uppercase text-[10px] font-bold">Terms</button>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}