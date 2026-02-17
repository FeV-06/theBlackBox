"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WidgetId } from "@/types/widget";

const DEFAULT_ORDER: WidgetId[] = [
    "quote_clock",
    "todo",
    "habits",
    "github",
    "weather",
    "links",
    "focus_summary",
    "projects_overview",
    "custom_api",
    "gmail",
];

const DEFAULT_ENABLED: Record<WidgetId, boolean> = {
    quote_clock: true,
    todo: true,
    habits: true,
    github: true,
    weather: true,
    links: true,
    focus_summary: true,
    projects_overview: true,
    custom_api: true,
    gmail: true,
};

interface WidgetState {
    order: WidgetId[];
    enabled: Record<WidgetId, boolean>;
    reorder: (newOrder: WidgetId[]) => void;
    toggle: (id: WidgetId) => void;
    setEnabled: (id: WidgetId, val: boolean) => void;
    reset: () => void;
}

export const useWidgetStore = create<WidgetState>()(
    persist(
        (set) => ({
            order: DEFAULT_ORDER,
            enabled: DEFAULT_ENABLED,
            reorder: (newOrder) => set({ order: newOrder }),
            toggle: (id) =>
                set((s) => ({
                    enabled: { ...s.enabled, [id]: !s.enabled[id] },
                })),
            setEnabled: (id, val) =>
                set((s) => ({
                    enabled: { ...s.enabled, [id]: val },
                })),
            reset: () => set({ order: DEFAULT_ORDER, enabled: DEFAULT_ENABLED }),
        }),
        { name: "tbb-widgets" }
    )
);
