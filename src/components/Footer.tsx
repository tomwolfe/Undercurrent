"use client";

import { Zap } from "lucide-react";

interface FooterProps {
  lastMined: string | null;
  setActiveModal: (modal: string | null) => void;
}

export function Footer({ lastMined, setActiveModal }: FooterProps) {
  return (
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
  );
}
