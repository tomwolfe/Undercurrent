"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Star, GitCommit, Code2, ArrowUpRight, TrendingUp, TrendingDown, Bookmark, Scale, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "./Sparkline";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

import { Gem } from "@/types";

interface GemCardProps {
  gem: Gem;
  now: number;
  isSaved?: boolean;
  onToggleSave?: (fullName: string) => void;
  onSelect?: (gem: Gem) => void;
}

export function GemCard({ gem, now, isSaved, onToggleSave, onSelect }: GemCardProps) {
  const getScoreVariant = (score: number) => {
    if (score >= 90) return "gold";
    if (score >= 70) return "silver";
    return "outline";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Gold";
    if (score >= 70) return "Silver";
    return "Gem";
  };

  const isRecent = useMemo(() => {
    if (now === 0) return false;
    return new Date(gem.pushed_at).getTime() > now - 7 * 24 * 60 * 60 * 1000;
  }, [gem.pushed_at, now]);

  const isNewRelease = useMemo(() => {
    if (!gem.latest_release?.published_at) return false;
    const publishedAt = new Date(gem.latest_release.published_at).getTime();
    return publishedAt > now - 30 * 24 * 60 * 60 * 1000;
  }, [gem.latest_release, now]);

  const trendIcon = useMemo(() => {
    if (gem.momentum_trend > 1.2) return <TrendingUp size={10} className="text-emerald-500" />;
    if (gem.momentum_trend < 0.8) return <TrendingDown size={10} className="text-rose-500" />;
    return null;
  }, [gem.momentum_trend]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onClick={() => onSelect?.(gem)}
      className="cursor-pointer"
    >
      <Card className="group relative h-full flex flex-col justify-between border-white/[0.05] bg-[#0A0A0A] p-0 hover:border-white/10 hover:bg-[#0F0F0F] transition-all duration-300 overflow-hidden">
        <CardContent className="p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Badge 
                  variant={getScoreVariant(gem.gem_score)}
                  className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                >
                  {getScoreLabel(gem.gem_score)} {gem.gem_score}
                </Badge>
                {isNewRelease && (
                  <Badge variant="default" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[9px] px-1.5 py-0">
                    NEW RELEASE
                  </Badge>
                )}
              </div>
              {trendIcon && (
                <div className="flex items-center gap-1 px-1">
                  {trendIcon}
                  <span className={cn(
                    "text-[8px] font-bold uppercase tracking-tighter",
                    gem.momentum_trend > 1.2 ? "text-emerald-500/70" : "text-rose-500/70"
                  )}>
                    {gem.momentum_trend > 1.2 ? "Trending Up" : "Cooling"}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {onToggleSave && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSave(gem.full_name);
                  }}
                  className={cn(
                    "transition-colors",
                    isSaved ? "text-blue-500" : "text-white/10 hover:text-white/30"
                  )}
                >
                  <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
                </button>
              )}
              {gem.activity && (
                <div className="opacity-40 group-hover:opacity-100 transition-opacity">
                  <Sparkline data={gem.activity} color={gem.gem_score >= 70 ? "#94a3b8" : "#4b5563"} />
                </div>
              )}
              <div className="flex items-center gap-1 text-[11px] font-medium text-white/40">
                <Star size={12} className="text-white/20" />
                <span>{(gem.stars / 1000).toFixed(1)}k</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold text-white/90 group-hover:text-white transition-colors flex items-center gap-2">
              {gem.name}
              {isRecent && (
                <span className="h-1 w-1 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              )}
            </h3>
            <p className="mt-2 line-clamp-2 text-sm text-white/40 leading-relaxed min-h-[40px]">
              {gem.description || "No description provided."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-white/50 bg-white/[0.02]">
              <Code2 size={10} className="text-white/30" />
              {gem.language}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-white/50 bg-white/[0.02]">
              <GitCommit size={10} className="text-white/30" />
              {gem.recent_commits} commits/wk
            </Badge>
            {gem.license && (
              <Badge variant="outline" className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-white/30 bg-white/[0.02]">
                <Scale size={10} />
                {gem.license}
              </Badge>
            )}
            {gem.latest_release && (
              <Badge variant="outline" className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-white/30 bg-white/[0.02]">
                <Timer size={10} />
                {gem.latest_release.tag}
              </Badge>
            )}
          </div>

          <div className="mt-2 flex gap-2">
            <a
              href={gem.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-white/[0.05] border border-white/5 px-4 py-2 text-xs font-semibold text-white/80 transition-all hover:bg-white/10 hover:text-white"
            >
              View Repo
            </a>
            <a
              href={gem.good_first_issues_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all",
                gem.has_good_first_issues 
                  ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:bg-blue-500 hover:shadow-[0_0_25px_rgba(37,99,235,0.3)]"
                  : "bg-white/[0.02] border border-white/5 text-white/20 cursor-not-allowed pointer-events-none"
              )}
            >
              {gem.has_good_first_issues ? "Contribute" : "Lurking"}
              {gem.has_good_first_issues && <ArrowUpRight size={14} />}
            </a>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
