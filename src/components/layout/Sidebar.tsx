"use client";

import { motion } from "framer-motion";
import {
    LayoutDashboard,
    FolderKanban,
    Focus,
    CalendarDays,
    Settings,
    User,
} from "lucide-react";
import type { TabId } from "@/types/widget";
import { useGoogleAuthStore } from "@/store/useGoogleAuthStore";

interface SidebarProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
}

const navItems: { id: TabId; icon: typeof LayoutDashboard; label: string }[] = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "projects", icon: FolderKanban, label: "Projects" },
    { id: "focus", icon: Focus, label: "Focus" },
    { id: "calendar", icon: CalendarDays, label: "Calendar" },
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
    const { isConnected, profile } = useGoogleAuthStore();

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-[72px] hidden md:flex flex-col items-center py-6 z-50 tbb-panel"
            style={{
                background: "rgba(0,0,0,0.3)",
                borderRight: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 8px 30px rgba(0,0,0,0.45)",
                backdropFilter: "blur(20px)",
            }}
        >
            {/* Glow Strip */}
            <div className="absolute top-0 right-0 h-full w-[2px] opacity-60 pointer-events-none" style={{ background: `linear-gradient(to bottom, var(--color-accent-glow), rgba(255,255,255,0.02), transparent)` }} />

            {/* Nav icons */}
            <nav className="flex flex-col items-center gap-2 flex-1 mt-4">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className="relative w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200 group hover:bg-white/5 hover:shadow-[0_0_15px_rgba(124,92,255,0.12)]"
                            style={{
                                background: isActive ? "var(--color-accent-glow)" : "transparent",
                                color: isActive ? "var(--color-accent)" : "rgba(255,255,255,0.4)",
                            }}
                            title={item.label}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute inset-0 rounded-xl"
                                    style={{
                                        background: "var(--color-accent-glow)",
                                        boxShadow: `0 0 25px var(--color-accent-glow)`,
                                        border: `1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)`,
                                    }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <Icon size={22} className="relative z-10" />
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Dock */}
            <div className="mt-auto border-t border-white/[0.04] pt-4 pb-2 w-[80%] flex flex-col items-center gap-3">
                {/* Settings Button */}
                <button
                    onClick={() => onTabChange("settings")}
                    className="relative w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200 hover:bg-white/5 hover:shadow-[0_0_15px_rgba(124,92,255,0.12)]"
                    style={{
                        background: activeTab === "settings" ? "var(--color-accent-glow)" : "transparent",
                        color: activeTab === "settings" ? "var(--color-accent)" : "rgba(255,255,255,0.4)",
                    }}
                    title="Settings"
                >
                    <Settings size={22} className="relative z-10" />
                </button>

                {/* Profile Block */}
                <button
                    onClick={() => { /* Placeholder Modal Logic */ }}
                    className="relative w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 hover:ring-2 hover:ring-purple-500/30 hover:scale-105"
                    title={profile?.name || "Profile"}
                >
                    {isConnected && profile?.picture ? (
                        <img
                            src={profile.picture}
                            alt={profile.name || "Profile"}
                            className="w-full h-full rounded-full object-cover shadow-lg shadow-black/50"
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div
                            className="w-full h-full rounded-full flex items-center justify-center shadow-lg shadow-black/50"
                            style={{ background: `linear-gradient(135deg, var(--color-accent), var(--color-accent-dim))` }}
                        >
                            <User size={18} className="text-white" />
                        </div>
                    )}
                </button>
            </div>
        </aside>
    );
}
