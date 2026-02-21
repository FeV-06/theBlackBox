"use client";

import { motion } from "framer-motion";
import {
    LayoutDashboard,
    FolderKanban,
    Focus,
    CalendarDays,
    Settings,
} from "lucide-react";
import type { TabId } from "@/types/widget";

interface MobileNavProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
}

const navItems: { id: TabId; icon: typeof LayoutDashboard; label: string }[] = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "projects", icon: FolderKanban, label: "Projects" },
    { id: "focus", icon: Focus, label: "Focus" },
    { id: "calendar", icon: CalendarDays, label: "Calendar" },
    { id: "settings", icon: Settings, label: "Settings" },
];

export default function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
            style={{
                background: "linear-gradient(180deg, rgba(11,11,14,0.92) 0%, rgba(11,11,14,0.98) 100%)",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
        >
            <div className="flex items-center justify-around px-2 h-16">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className="relative flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-2xl transition-all"
                            style={{
                                color: isActive ? "var(--color-accent)" : "rgba(255,255,255,0.4)",
                            }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="mobile-nav-active"
                                    className="absolute inset-0 rounded-2xl"
                                    style={{
                                        background: "var(--color-accent-glow)",
                                        boxShadow: `0 0 16px var(--color-accent-glow)`,
                                    }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <Icon size={20} className="relative z-10" />
                            <span
                                className="text-[10px] font-medium relative z-10"
                                style={{
                                    color: isActive ? "var(--color-accent)" : "rgba(255,255,255,0.35)",
                                }}
                            >
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
