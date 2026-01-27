"use client";

import { cn } from "@/lib/utils";
import { SortOption } from "@/types";

interface FiltersBarProps {
  languages: string[];
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
}

export function FiltersBar({ 
  languages, 
  selectedLanguage, 
  setSelectedLanguage, 
  sortBy, 
  setSortBy 
}: FiltersBarProps) {
  return (
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
          {(["score", "recent", "stars", "saved"] as const).map((option) => (
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
  );
}
