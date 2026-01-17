"use client";

import { motion } from "framer-motion";
import { Star, GitCommit, ExternalLink, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Gem {
  name: string;
  full_name: string;
  description: string;
  url: string;
  stars: number;
  language: string;
  gem_score: number;
  recent_commits: number;
  good_first_issues_url: string;
  has_good_first_issues: boolean;
  pushed_at: string;
}

interface GemCardProps {
  gem: Gem;
}

export function GemCard({ gem }: GemCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    if (score >= 70) return "bg-slate-300/10 text-slate-300 border-slate-300/20";
    return "bg-orange-500/10 text-orange-500 border-orange-500/20";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Gold";
    if (score >= 70) return "Silver";
    return "Bronze";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex flex-col justify-between rounded-xl border border-white/10 bg-black p-6 hover:border-white/20 transition-all duration-300"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider",
            getScoreColor(gem.gem_score)
          )}>
            <span>{getScoreLabel(gem.gem_score)}</span>
            <span>{gem.gem_score}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Star size={14} />
            <span>{gem.stars.toLocaleString()}</span>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
            {gem.name}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm text-white/60 leading-relaxed">
            {gem.description || "No description provided."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 text-xs text-white/80">
            <Code2 size={12} />
            {gem.language}
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 text-xs text-white/80">
            <GitCommit size={12} />
            {gem.recent_commits} commits/wk
          </div>
        </div>

        {/* Momentum Sparkline Placeholder */}
        <div className="h-8 w-full mt-2 flex items-end gap-1 overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="w-full bg-blue-500/20 rounded-t-sm"
              style={{ 
                height: `${Math.max(20, Math.random() * 100)}%`,
                opacity: (i + 1) / 12 
              }}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <a
          href={gem.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-white/90"
        >
          View Repo
        </a>
        <a
          href={gem.good_first_issues_url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-white/5",
            !gem.has_good_first_issues && "opacity-50 grayscale cursor-not-allowed"
          )}
          title={gem.has_good_first_issues ? "Contribute" : "No Good First Issues found"}
        >
          <ExternalLink size={16} />
        </a>
      </div>
    </motion.div>
  );
}
