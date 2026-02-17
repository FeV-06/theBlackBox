"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QuoteVibe, Bookmark, ApiWidgetInstance } from "@/types/widget";
import { generateId } from "@/lib/utils";

interface SettingsState {
    quoteVibe: QuoteVibe;
    bookmarks: Bookmark[];
    apiWidgets: ApiWidgetInstance[];
    setQuoteVibe: (vibe: QuoteVibe) => void;
    addBookmark: (title: string, url: string) => void;
    deleteBookmark: (id: string) => void;
    addApiWidget: (widget: Omit<ApiWidgetInstance, "id">) => void;
    updateApiWidget: (id: string, updates: Partial<ApiWidgetInstance>) => void;
    deleteApiWidget: (id: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            quoteVibe: "motivational",
            bookmarks: [
                { id: "bk1", title: "GitHub", url: "https://github.com" },
                { id: "bk2", title: "StackOverflow", url: "https://stackoverflow.com" },
                { id: "bk3", title: "ChatGPT", url: "https://chat.openai.com" },
            ],
            apiWidgets: [],

            setQuoteVibe: (vibe) => set({ quoteVibe: vibe }),

            addBookmark: (title, url) =>
                set((s) => ({
                    bookmarks: [...s.bookmarks, { id: generateId(), title, url }],
                })),

            deleteBookmark: (id) =>
                set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) })),

            addApiWidget: (widget) =>
                set((s) => ({
                    apiWidgets: [...s.apiWidgets, { ...widget, id: generateId() }],
                })),

            updateApiWidget: (id, updates) =>
                set((s) => ({
                    apiWidgets: s.apiWidgets.map((w) =>
                        w.id === id ? { ...w, ...updates } : w
                    ),
                })),

            deleteApiWidget: (id) =>
                set((s) => ({ apiWidgets: s.apiWidgets.filter((w) => w.id !== id) })),
        }),
        { name: "tbb-settings" }
    )
);
