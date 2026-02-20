"use client";

import { motion } from "framer-motion";

type TabId = "focus" | "tasks" | "projects" | "combined";

const TABS: { id: TabId; label: string }[] = [
    { id: "focus", label: "Focus" },
    { id: "tasks", label: "Tasks" },
    { id: "projects", label: "Projects" },
    { id: "combined", label: "Combined" },
];

interface InsightsTabsProps {
    tab: TabId;
    setTab: (t: TabId) => void;
}

export default function InsightsTabs({ tab, setTab }: InsightsTabsProps) {
    return (
        <div className="flex gap-0 border-b border-white/[0.05] mb-2 shrink-0">
            {TABS.map((t) => (
                <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-all relative ${tab === t.id ? "text-white" : "text-white/30 hover:text-white/60"
                        }`}
                >
                    {t.label}
                    {tab === t.id && (
                        <motion.div
                            layoutId="insights-tab-underline"
                            className="absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-full"
                            style={{
                                background: "var(--color-accent)",
                                boxShadow: "0 0 8px rgba(124,92,255,0.4)",
                            }}
                        />
                    )}
                </button>
            ))}
        </div>
    );
}
