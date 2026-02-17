"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Habit } from "@/types/widget";
import { generateId, getTodayStr } from "@/lib/utils";

interface HabitState {
    habits: Habit[];
    addHabit: (name: string) => void;
    deleteHabit: (id: string) => void;
    toggleToday: (id: string) => void;
    getStreak: (habit: Habit) => number;
}

function calcStreak(checkedDates: string[]): number {
    if (checkedDates.length === 0) return 0;
    const sorted = [...checkedDates].sort().reverse();
    const today = getTodayStr();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (sorted[0] !== today && sorted[0] !== yesterdayStr) return 0;

    let streak = 1;
    for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1] + "T00:00:00");
        const curr = new Date(sorted[i] + "T00:00:00");
        const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) streak++;
        else break;
    }
    return streak;
}

export const useHabitStore = create<HabitState>()(
    persist(
        (set) => ({
            habits: [],
            addHabit: (name) =>
                set((s) => ({
                    habits: [
                        ...s.habits,
                        { id: generateId(), name, checkedDates: [], createdAt: Date.now() },
                    ],
                })),
            deleteHabit: (id) =>
                set((s) => ({ habits: s.habits.filter((h) => h.id !== id) })),
            toggleToday: (id) =>
                set((s) => ({
                    habits: s.habits.map((h) => {
                        if (h.id !== id) return h;
                        const today = getTodayStr();
                        const has = h.checkedDates.includes(today);
                        return {
                            ...h,
                            checkedDates: has
                                ? h.checkedDates.filter((d) => d !== today)
                                : [...h.checkedDates, today],
                        };
                    }),
                })),
            getStreak: (habit) => calcStreak(habit.checkedDates),
        }),
        { name: "tbb-habits" }
    )
);
