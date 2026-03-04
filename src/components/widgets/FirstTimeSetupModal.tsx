"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WIDGET_REGISTRY } from "@/lib/widgetRegistry";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useWidgetStore } from "@/store/useWidgetStore";
import type { WidgetType } from "@/types/widgetInstance";
import { Check, Settings2, Sparkles } from "lucide-react";

export default function FirstTimeSetupModal() {
    const { setHasCompletedSetup } = useSettingsStore();
    const { addInstance } = useWidgetStore();

    // Default selected set. Users can toggle these as they wish.
    const [selected, setSelected] = useState<Set<WidgetType>>(
        new Set(["todo", "weather", "quick_links", "github"])
    );

    const toggleSelection = (type: WidgetType) => {
        const next = new Set(selected);
        if (next.has(type)) {
            next.delete(type);
        } else {
            next.add(type);
        }
        setSelected(next);
    };

    const handleSave = () => {
        const types = Array.from(selected);
        // Add always-on widgets if not selected
        if (!selected.has("quote_clock")) types.unshift("quote_clock");

        types.forEach(type => addInstance(type));
        setHasCompletedSetup(true);
    };

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl"
            style={{ background: "rgba(0, 0, 0, 0.4)" }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full max-w-3xl flex flex-col max-h-full overflow-hidden rounded-[32px] tbb-panel border"
                style={{
                    background: "var(--color-bg-card)",
                    borderColor: "var(--color-border)"
                }}
            >
                {/* Header */}
                <div className="p-4 sm:p-6 shrink-0 border-b border-t shadow-sm"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-bg-elevated)" }}>
                    <div className="flex items-center gap-3 sm:gap-4 mb-1 sm:mb-2">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-lg"
                            style={{ background: "var(--color-accent-glow)", border: "1px solid var(--color-accent)" }}>
                            <Sparkles className="w-6 h-6" style={{ color: "var(--color-accent)" }} />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-3xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
                                Welcome to TheBlackBox
                            </h2>
                            <p className="text-xs sm:text-sm mt-0.5 sm:mt-1" style={{ color: "var(--color-text-secondary)" }}>
                                Select the standard widgets you'd like to start with.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
                        {WIDGET_REGISTRY.filter(def => def.type !== "quote_clock" && def.type !== "section_divider").map((def) => {
                            const isSelected = selected.has(def.type);
                            const Icon = def.icon;

                            return (
                                <button
                                    key={def.type}
                                    onClick={() => toggleSelection(def.type)}
                                    className="relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-left transition-all duration-200 border group overflow-hidden"
                                    style={{
                                        background: isSelected ? "var(--color-accent-glow)" : "var(--color-bg-elevated)",
                                        borderColor: isSelected ? "var(--color-accent)" : "var(--color-border)",
                                    }}
                                >
                                    {/* Icon Box */}
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                                        style={{
                                            background: isSelected ? "var(--color-accent)" : "var(--color-bg-card)",
                                        }}>
                                        <Icon className="w-5 h-5 transition-colors"
                                            style={{ color: isSelected ? "white" : "var(--color-text-muted)" }} />
                                    </div>

                                    {/* Text Content */}
                                    <div className="flex flex-col min-w-0 pr-6">
                                        <span className="font-semibold text-sm transition-colors truncate"
                                            style={{ color: isSelected ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}>
                                            {def.defaultTitle}
                                        </span>
                                    </div>

                                    {/* Checkmark Indicator */}
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <div className="w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-200"
                                            style={{
                                                borderColor: isSelected ? "var(--color-accent)" : "var(--color-border)",
                                                background: isSelected ? "var(--color-accent)" : "transparent",
                                            }}>
                                            {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 sm:p-6 shrink-0 border-t flex flex-wrap gap-3 sm:gap-4 items-center justify-between"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-bg-elevated)" }}>
                    <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                        {selected.size} widget{selected.size === 1 ? '' : 's'} selected
                    </p>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold transition-all duration-200 shadow-lg flex items-center gap-2 btn-accent focus:outline-none"
                    >
                        <Settings2 className="w-4 h-4" />
                        <span>Build Dashboard</span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
