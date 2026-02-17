"use client";

import { useState } from "react";
import { Flame, Plus, Trash2, Check } from "lucide-react";
import { useHabitStore } from "@/store/useHabitStore";
import { getTodayStr } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { WidgetInstance } from "@/types/widgetInstance";

export default function HabitTrackerWidget({ instance }: { instance: WidgetInstance }) {
    const { habits, addHabit, deleteHabit, toggleToday, getStreak } = useHabitStore();
    const [input, setInput] = useState("");
    const today = getTodayStr();

    const handleAdd = () => {
        const name = input.trim();
        if (!name) return;
        addHabit(name);
        setInput("");
    };

    return (
        <div className="flex flex-col gap-3">
            {/* Add habit */}
            <div className="flex gap-2">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    placeholder="New habit..."
                    className="flex-1 bg-white/[0.03] border border-[color:var(--color-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[color:var(--color-accent)] transition-colors"
                    style={{ color: "var(--color-text-primary)" }}
                />
                <button onClick={handleAdd} className="btn-accent px-3 py-2">
                    <Plus size={14} />
                </button>
            </div>

            {/* Habits list */}
            <div className="flex flex-col gap-2 max-h-48 overflow-auto">
                <AnimatePresence>
                    {habits.map((habit) => {
                        const checked = habit.checkedDates.includes(today);
                        const streak = getStreak(habit);
                        return (
                            <motion.div
                                key={habit.id}
                                layout
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                className="flex items-center gap-3 px-3 py-2 rounded-xl group transition-colors"
                                style={{ background: "rgba(255,255,255,0.02)" }}
                            >
                                <button
                                    onClick={() => toggleToday(habit.id)}
                                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all"
                                    style={{
                                        background: checked ? "var(--color-accent)" : "transparent",
                                        border: checked ? "none" : "1.5px solid rgba(255,255,255,0.15)",
                                    }}
                                >
                                    {checked && <Check size={14} className="text-white" />}
                                </button>
                                <span className="flex-1 text-sm" style={{ color: "var(--color-text-primary)" }}>
                                    {habit.name}
                                </span>
                                {streak > 0 && (
                                    <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--color-warning)" }}>
                                        <Flame size={12} />
                                        {streak}
                                    </span>
                                )}
                                <button
                                    onClick={() => deleteHabit(habit.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/5 transition-all"
                                    style={{ color: "var(--color-danger)" }}
                                >
                                    <Trash2 size={12} />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                {habits.length === 0 && (
                    <p className="text-xs text-center py-4" style={{ color: "var(--color-text-muted)" }}>
                        No habits yet. Add one above!
                    </p>
                )}
            </div>
        </div>
    );
}
