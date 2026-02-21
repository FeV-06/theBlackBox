"use client";

import { Search } from "lucide-react";
import { useCommandPalette } from "@/components/CommandPalette";

export default function Header() {
    const { open: openPalette } = useCommandPalette();

    return (
        <header
            className="relative flex items-center px-6 py-0 h-16 shrink-0 z-20"
            style={{
                background: "rgba(0,0,0,0.25)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 8px 30px rgba(0,0,0,0.45)",
            }}
        >
            {/* Bottom Highlight Strip */}
            <div className="absolute bottom-0 left-0 w-full h-[2px] opacity-60 pointer-events-none" style={{ background: `linear-gradient(to right, var(--color-accent-glow), rgba(255,255,255,0.02), transparent)` }} />

            {/* Left Spacer */}
            <div className="flex-1" />

            {/* Centered Search Bar */}
            <div className="flex justify-center w-[clamp(320px,40%,600px)]">
                <button
                    onClick={openPalette}
                    className="
                        flex items-center gap-3 px-4 w-full h-10
                        bg-white/[0.04] backdrop-blur-lg
                        border border-white/[0.08]
                        rounded-xl
                        transition-all duration-200 ease-out
                        hover:border-purple-400/40 hover:bg-white/[0.06] hover:shadow-[0_0_20px_rgba(124,92,255,0.15)]
                        focus-within:border-purple-500 focus-within:bg-white/[0.08] 
                        focus-within:ring-2 focus-within:ring-purple-500/30
                        focus-within:scale-[1.02] active:scale-[0.98]
                        group
                    "
                >
                    <Search size={16} className="text-white/40 group-hover:text-white/70 transition-colors" />
                    <span className="flex-1 text-left text-sm text-white/50 group-hover:text-white/80 transition-colors">
                        Search anything...
                    </span>
                    <span className="text-[10px] font-bold text-white/20 bg-white/5 px-1.5 py-0.5 rounded tracking-widest uppercase">
                        Ctrl+K
                    </span>
                </button>
            </div>

            {/* Right Spacer */}
            <div className="flex-1" />
        </header>
    );
}
