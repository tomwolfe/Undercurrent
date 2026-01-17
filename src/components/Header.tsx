"use client";

import { Search, Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  noHype: boolean;
  setNoHype: (noHype: boolean) => void;
}

export function Header({ searchQuery, setSearchQuery, noHype, setNoHype }: HeaderProps) {
  return (
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
  );
}
