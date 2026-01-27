"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Info, X } from "lucide-react";
import { GemCard } from "@/components/GemCard";
import { MasonryGrid } from "@/components/MasonryGrid";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FiltersBar } from "@/components/FiltersBar";
import { Modal } from "@/components/Modal";
import { Gem, SortOption } from "@/types";
import { useLocalStorage, useDebounce } from "@/lib/hooks";

interface ExplorerProps {
  initialGems: Gem[];
  lastMined: string | null;
}

export function Explorer({ initialGems, lastMined }: ExplorerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [noHype, setNoHype] = useState(searchParams.get("noHype") === "true");
  const [selectedLanguage, setSelectedLanguage] = useState<string>(searchParams.get("lang") || "All");
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get("sort") as SortOption) || "score");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [now, setNow] = useState(0);

  const [savedGems, setSavedGems] = useLocalStorage<string[]>("saved-gems", []);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (noHype) params.set("noHype", "true");
    else params.delete("noHype");
    
    if (selectedLanguage !== "All") params.set("lang", selectedLanguage);
    else params.delete("lang");
    
    if (sortBy !== "score") params.set("sort", sortBy);
    else params.delete("sort");
    
    if (debouncedSearchQuery) params.set("q", debouncedSearchQuery);
    else params.delete("q");

    const query = params.toString();
    const newUrl = query ? `${pathname}?${query}` : pathname;
    
    router.replace(newUrl, { scroll: false });
  }, [noHype, selectedLanguage, sortBy, debouncedSearchQuery, pathname, router, searchParams]);

  const languages = useMemo(() => {
    const langs = new Set(initialGems.map((g) => g.language));
    return ["All", ...Array.from(langs).filter(Boolean)].sort();
  }, [initialGems]);

  const toggleSave = (fullName: string) => {
    setSavedGems((prev) => 
      prev.includes(fullName) 
        ? prev.filter(name => name !== fullName) 
        : [...prev, fullName]
    );
  };

  const filteredGems = useMemo(() => {
    return initialGems
      .filter((gem) => {
        // Hype filter (now uses pre-computed field)
        if (noHype && gem.is_hype) {
          return false;
        }
        
        // Language filter
        if (selectedLanguage !== "All" && gem.language !== selectedLanguage) {
          return false;
        }

        // Saved filter (when sortBy is 'saved')
        if (sortBy === "saved" && !savedGems.includes(gem.full_name)) {
          return false;
        }

        // Search query
        if (debouncedSearchQuery) {
          const query = debouncedSearchQuery.toLowerCase();
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
        if (sortBy === "saved") {
          // Keep saved gems in original score order but only show saved ones (handled by filter above)
          return b.gem_score - a.gem_score;
        }
        return 0;
      });
  }, [initialGems, noHype, selectedLanguage, sortBy, debouncedSearchQuery, savedGems]);

  const clearFilters = () => {
    setNoHype(false);
    setSelectedLanguage("All");
    setSortBy("score");
    setSearchQuery("");
  };

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
        <p>The engine runs every 12 hours via GitHub Actions, scanning thousands of repositories to surface the top 250 contenders.</p>
      </Modal>

      <Modal 
        title="Scoring Logic" 
        isOpen={activeModal === "scoring"} 
        onClose={() => setActiveModal(null)}
      >
        <p>Gems are ranked using a multi-factor momentum algorithm designed to highlight activity relative to visibility.</p>
        <div className="bg-white/5 p-4 rounded-xl border border-white/5 font-mono text-[10px] text-blue-400">
          score = ((Momentum + Contribution + 10) / (Visibility * Maturity)) * Lang_Multiplier
        </div>
        <div className="space-y-2">
          <p className="font-semibold text-white">Weighting Factors:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><span className="text-white/90">Momentum:</span> log2 of recent commit volume.</li>
            <li><span className="text-white/90">Contribution:</span> Rewards labeled issues and &quot;good first issues&quot;.</li>
            <li><span className="text-white/90">Visibility:</span> log10 of stars (normalizes growth).</li>
            <li><span className="text-white/90">Maturity:</span> Rewards consistent development over time.</li>
          </ul>
        </div>
      </Modal>

      <Modal 
        title="Privacy Policy" 
        isOpen={activeModal === "privacy"} 
        onClose={() => setActiveModal(null)}
      >
        <p>Undercurrent is a static, client-side application. We do not track you, we do not use cookies, and we do not store any personal data on our servers.</p>
        <p>Your &quot;Saved&quot; gems are stored locally in your browser&apos;s localStorage and never leave your device.</p>
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
          <ErrorBoundary>
            <MasonryGrid className="gap-6">
              {filteredGems.map((gem) => (
                <GemCard 
                  key={gem.full_name} 
                  gem={gem} 
                  now={now} 
                  isSaved={savedGems.includes(gem.full_name)}
                  onToggleSave={toggleSave}
                />
              ))}
            </MasonryGrid>
          </ErrorBoundary>
        ) : (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <div className="h-20 w-20 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6">
              <X size={32} className="text-white/10" />
            </div>
            <h3 className="text-xl font-semibold text-white/80">No gems found</h3>
            <p className="text-sm text-white/30 mt-2 max-w-xs mb-8">
              {sortBy === "saved" 
                ? "You haven't saved any gems yet. Explore and bookmark some interesting projects!"
                : "The current filter combination returned no results. Try broadening your search."}
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-semibold transition-all"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      <Footer lastMined={lastMined} setActiveModal={setActiveModal} />
    </main>
  );
}