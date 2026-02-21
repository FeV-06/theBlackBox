"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QuoteClockWidget from "@/components/widgets/QuoteClockWidget";
import WeatherWidget from "@/components/widgets/WeatherWidget";
import KanbanWidget from "@/components/widgets/KanbanWidget";
import type { WidgetInstance } from "@/types/widgetInstance";

const dummyInstance: WidgetInstance = {
    instanceId: "landing-preview",
    type: "quote_clock",
    enabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    config: {},
    layout: { w: 2, h: 2, x: 0, y: 0 },
    isLocked: true,
};

export default function ProblemSolution() {
    const [activeTab, setActiveTab] = useState(0);

    return (
        <section id="demo" className="w-full py-24 px-6 bg-background text-foreground">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                {/* Left Content */}
                <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                        Stop switching between apps every morning.
                    </h2>
                    <div className="mt-4 h-[2px] w-16 bg-primary rounded-full" />

                    <p className="mt-6 text-muted-foreground text-lg leading-relaxed">
                        Your notes, tasks, weather, calendar, and tools are scattered
                        across different apps. It slows you down before your day even
                        starts.
                    </p>

                    <p className="mt-6 text-lg font-medium">
                        The Black Box brings everything into one place.
                    </p>

                    <ul className="mt-6 space-y-2 text-muted-foreground">
                        <li>• Notes</li>
                        <li>• Tasks</li>
                        <li>• Weather</li>
                        <li>• Calendar</li>
                        <li>• Tools</li>
                    </ul>
                </motion.div>

                {/* Right Visual Placeholder -> Interactive Canvas */}
                <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col gap-5"
                >
                    {/* Tabs / Selector */}
                    <div className="flex flex-wrap gap-2">
                        {["Quote & Clock", "Weather", "Kanban Board"].map((tab, idx) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(idx)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === idx
                                    ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(124,92,255,0.3)] border border-primary/50"
                                    : "bg-card/40 border border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Widget Canvas Area */}
                    <div className="h-[420px] rounded-2xl border border-border bg-[url('/grid-pattern.svg')] bg-[length:30px_30px] shadow-2xl overflow-hidden relative p-4 sm:p-6 flex flex-col items-center justify-center">
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] z-0" />

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.96, y: -15 }}
                                transition={{ duration: 0.35, ease: "easeOut" }}
                                className="w-full max-w-sm glass-card p-4 rounded-2xl h-[340px] flex flex-col z-10 relative"
                            >
                                {/* Mock Header */}
                                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
                                    <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
                                    <span className="text-xs font-semibold text-foreground tracking-wider uppercase">
                                        {activeTab === 0 ? "Quote & Clock" : activeTab === 1 ? "Weather" : "Kanban Board"}
                                    </span>
                                </div>

                                {/* Widget Content Container */}
                                <div className="flex-1 overflow-auto custom-scrollbar pr-1 -mr-1 min-h-0 relative">
                                    {activeTab === 0 && <QuoteClockWidget instance={dummyInstance} />}
                                    {activeTab === 1 && <WeatherWidget instance={dummyInstance} />}
                                    {activeTab === 2 && <KanbanWidget instance={dummyInstance} />}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
