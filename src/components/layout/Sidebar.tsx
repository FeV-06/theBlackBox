"use client";

import { motion } from "framer-motion";
import {
    LayoutDashboard,
    FolderKanban,
    Focus,
    CalendarDays,
    Settings,
    Hexagon,
} from "lucide-react";
import type { TabId } from "@/types/widget";

interface SidebarProps {
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

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
    return (
        <aside className="fixed left-0 top-0 bottom-0 w-[72px] hidden md:flex flex-col items-center py-6 z-50"
            style={{
                background: "linear-gradient(180deg, rgba(11,11,14,0.95) 0%, rgba(20,20,25,0.98) 100%)",
                borderRight: "1px solid rgba(255,255,255,0.06)",
            }}
        >
            {/* Nav icons */}
            <nav className="flex flex-col items-center gap-2 flex-1 mt-4">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className="relative w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200 group"
                            style={{
                                background: isActive ? "rgba(124, 92, 255, 0.12)" : "transparent",
                                color: isActive ? "#7C5CFF" : "rgba(255,255,255,0.4)",
                            }}
                            title={item.label}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute inset-0 rounded-xl"
                                    style={{
                                        background: "rgba(124, 92, 255, 0.12)",
                                        boxShadow: "0 0 20px rgba(124, 92, 255, 0.15)",
                                    }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <Icon size={22} className="relative z-10" />
                            {/* Tooltip */}
                            <span className="absolute left-full ml-3 px-2 py-1 text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
                                style={{ background: "#1B1B22", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.1)" }}
                            >
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {/* Logo at bottom */}
            <div className="mt-auto">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl"
                    style={{ background: "linear-gradient(135deg, #7C5CFF, #5B3FCC)" }}
                >
                    <Hexagon size={20} className="text-white" />
                </div>
            </div>
        </aside>
    );
}
