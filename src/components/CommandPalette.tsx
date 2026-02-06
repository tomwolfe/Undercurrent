"use client";

import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import { Search, Star, Code2, ArrowUpRight, Github } from "lucide-react";
import { Gem } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

interface CommandPaletteProps {
  gems: Gem[];
}

export function CommandPalette({ gems }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A] shadow-2xl"
          >
            <Command className="flex h-full w-full flex-col">
              <div className="flex items-center border-b border-white/5 px-4">
                <Search className="mr-3 h-4 w-4 shrink-0 text-white/40" />
                <Command.Input
                  autoFocus
                  placeholder="Search gems, languages, or topics... (Ctrl+K)"
                  className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <Command.List className="max-h-[350px] overflow-y-auto overflow-x-hidden p-2">
                <Command.Empty className="py-6 text-center text-sm text-white/20">
                  No gems found for this search.
                </Command.Empty>
                <Command.Group heading="Repositories" className="px-2 py-3 text-[10px] font-bold uppercase tracking-widest text-white/20">
                  {gems.map((gem) => (
                    <Command.Item
                      key={gem.full_name}
                      onSelect={() => {
                        window.open(gem.url, "_blank");
                        setOpen(false);
                      }}
                      className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-3 text-sm text-white/60 outline-none hover:bg-white/5 hover:text-white data-[selected=true]:bg-white/5 data-[selected=true]:text-white transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Github size={16} className="text-white/20" />
                        <div className="flex flex-col">
                          <span className="font-semibold">{gem.name}</span>
                          <span className="text-[11px] text-white/30 line-clamp-1">{gem.description}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/30">
                          <Code2 size={12} />
                          {gem.language}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/30">
                          <Star size={12} />
                          {(gem.stars / 1000).toFixed(1)}k
                        </div>
                        <ArrowUpRight size={14} className="text-white/10" />
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
