"use client";

import { useMemo } from "react";
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
  now: number;
}

export function GemCard({ gem, now }: GemCardProps) {
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

  const isRecent = useMemo(() => {
    if (now === 0) return false;
    return new Date(gem.pushed_at).getTime() > now - 7 * 24 * 60 * 60 * 1000;
  }, [gem.pushed_at, now]);

  const getInstallCommand = (lang: string, name: string) => {
    const l = lang.toLowerCase();
    if (l === "typescript" || l === "javascript") return `npm install ${name.toLowerCase()}`;
    if (l === "python") return `pip install ${name.toLowerCase()}`;
    if (l === "rust") return `cargo add ${name.toLowerCase()}`;
    if (l === "go") return `go get ${gem.full_name}`;
    return null;
  };

  const installCmd = getInstallCommand(gem.language, gem.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex flex-col justify-between rounded-xl border border-white/10 bg-black p-6 hover:border-white/20 transition-all duration-300"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div 
            title={`Score Breakdown:\n• Activity: ${gem.recent_commits} commits/wk\n• Stars: ${gem.stars}\n• Freshness: ${isRecent ? "High" : "Medium"}`}
            className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider cursor-help",
              getScoreColor(gem.gem_score)
            )}
          >
            <span>{getScoreLabel(gem.gem_score)}</span>
            <span>{gem.gem_score}</span>
          </div>
          <div className="flex items-center gap-2">
            {isRecent && (
              <span className="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" title="Recently updated" />
            )}
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <Star size={14} />
              <span>{gem.stars.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
            {gem.name}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm text-white/60 leading-relaxed min-h-[40px]">
            {gem.description || "No description provided."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 text-[11px] text-white/80 border border-white/5">
            <Code2 size={12} className="text-blue-400" />
            {gem.language}
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 text-[11px] text-white/80 border border-white/5">
            <GitCommit size={12} className="text-green-400" />
            {gem.recent_commits} commits/wk
          </div>
          {gem.has_good_first_issues && (
            <div className="flex items-center gap-1.5 rounded-md bg-blue-500/10 px-2 py-1 text-[11px] text-blue-400 border border-blue-500/20">
              Help Wanted
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {installCmd && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(installCmd);
              // Simple feedback would be nice, but keeping it minimal as per mandates
            }}
            className="w-full flex items-center justify-between gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-[11px] font-mono text-white/40 hover:text-white/80 hover:bg-white/10 transition-all"
            title="Click to copy install command"
          >
            <span className="truncate">{installCmd}</span>
            <ExternalLink size={10} />
          </button>
        )}
        
        <div className="flex gap-2">
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
              !gem.has_good_first_issues && "opacity-50 grayscale cursor-not-allowed pointer-events-none"
            )}
            title={gem.has_good_first_issues ? "Contribute to this project" : "No Good First Issues available"}
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
