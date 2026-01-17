"use client";

import { useState, useMemo, useEffect } from "react";
import { Info } from "lucide-react";
import { GemCard } from "@/components/GemCard";
import { MasonryGrid } from "@/components/MasonryGrid";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FiltersBar } from "@/components/FiltersBar";
import { Modal } from "@/components/Modal";
import { Gem, SortOption } from "@/types";

interface ExplorerProps {
  initialGems: Gem[];
  lastMined: string | null;
}

export function Explorer({ initialGems, lastMined }: ExplorerProps) {
  const [noHype, setNoHype] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("All");
  const [sortBy, setSortBy] = useState<SortOption>("score");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
  }, []);

  const languages = useMemo(() => {
    const langs = new Set(initialGems.map((g) => g.language));
    return ["All", ...Array.from(langs).filter(Boolean)].sort();
  }, [initialGems]);

  const filteredGems = useMemo(() => {
    return initialGems
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
  }, [initialGems, noHype, selectedLanguage, sortBy, searchQuery]);

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

      <Header 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        noHype={noHype} 
        setNoHype={setNoHype} 
      />

      <FiltersBar 
        languages={languages} 
        selectedLanguage={selectedLanguage} 
        setSelectedLanguage={setSelectedLanguage} 
        sortBy={sortBy} 
        setSortBy={setSortBy} 
      />

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        {filteredGems.length > 0 ? (
          <MasonryGrid columnCount={4} className="gap-6">
            {filteredGems.map((gem) => (
              <GemCard key={gem.full_name} gem={gem} now={now} />
            ))}
          </MasonryGrid>
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

      <Footer lastMined={lastMined} setActiveModal={setActiveModal} />
    </main>
  );
}
