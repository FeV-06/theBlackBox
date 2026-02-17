"use client";

import { Search, User, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useGoogleAuthStore } from "@/store/useGoogleAuthStore";
import { fetchQuote } from "@/lib/utils";

export default function Header() {
    const [quote, setQuote] = useState("");
    const vibe = useSettingsStore((s) => s.quoteVibe);
    const { isConnected, profile, checkConnection } = useGoogleAuthStore();

    useEffect(() => {
        fetchQuote(vibe).then(setQuote);
    }, [vibe]);

    useEffect(() => {
        checkConnection();
    }, [checkConnection]);

    return (
        <header
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-0 h-auto sm:h-16 shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
        >
            {/* Top row on mobile: search + right icons */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Search */}
                <div
                    className="flex items-center gap-2 px-4 h-10 rounded-xl flex-1 sm:flex-initial sm:w-[280px]"
                    style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                    }}
                >
                    <Search size={16} className="text-[color:var(--color-text-muted)]" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-transparent text-sm outline-none flex-1 placeholder:text-[color:var(--color-text-muted)]"
                        style={{ color: "var(--color-text-primary)" }}
                    />
                </div>

                {/* Google badge + avatar (always visible, right-aligned on mobile) */}
                <div className="flex items-center gap-2 ml-auto sm:ml-0 sm:hidden">
                    {isConnected && (
                        <div
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium flex-shrink-0"
                            style={{
                                background: "rgba(74,222,128,0.1)",
                                color: "#4ADE80",
                                border: "1px solid rgba(74,222,128,0.15)",
                            }}
                        >
                            <CheckCircle size={12} />
                        </div>
                    )}
                    {isConnected && profile?.picture ? (
                        <img
                            src={profile.picture}
                            alt={profile.name || "Profile"}
                            className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, #7C5CFF, #5B3FCC)" }}
                        >
                            <User size={16} className="text-white" />
                        </div>
                    )}
                </div>
            </div>

            {/* Quote — hidden on mobile */}
            <div className="hidden sm:block flex-1 text-center px-4 overflow-hidden">
                <p className="text-sm truncate" style={{ color: "var(--color-text-secondary)" }}>
                    {quote || "Loading..."}
                </p>
            </div>

            {/* Desktop-only badge + avatar */}
            <div className="hidden sm:flex items-center gap-3">
                {isConnected && (
                    <div
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0"
                        style={{
                            background: "rgba(74,222,128,0.1)",
                            color: "#4ADE80",
                            border: "1px solid rgba(74,222,128,0.15)",
                        }}
                    >
                        <CheckCircle size={12} />
                        Google
                    </div>
                )}
                {isConnected && profile?.picture ? (
                    <img
                        src={profile.picture}
                        alt={profile.name || "Profile"}
                        className="w-9 h-9 rounded-full flex-shrink-0 cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-purple-500/30 object-cover"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-purple-500/30"
                        style={{ background: "linear-gradient(135deg, #7C5CFF, #5B3FCC)" }}
                    >
                        <User size={18} className="text-white" />
                    </div>
                )}
            </div>
        </header>
    );
}
