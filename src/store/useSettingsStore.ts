"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QuoteVibe, Bookmark, ApiWidgetInstance } from "@/types/widget";
import type { GmailSettings } from "@/types/gmail";
import type { GmailPreset } from "@/types/gmailPresets";
import type { CommandPaletteTheme } from "@/types/commandPalette";
import { generateId } from "@/lib/utils";

const DEFAULT_GMAIL: GmailSettings = {
    mode: "basic",
    mailbox: "inbox",
    status: "all",
    category: "all",
    query: "",
};

const now = Date.now();
const DEFAULT_GMAIL_PRESETS: GmailPreset[] = [
    { id: "preset_github", name: "GitHub", query: "from:github newer_than:7d", createdAt: now, updatedAt: now },
    { id: "preset_unread", name: "Unread", query: "is:unread", createdAt: now, updatedAt: now },
    { id: "preset_attachments", name: "Attachments", query: "has:attachment newer_than:30d", createdAt: now, updatedAt: now },
    { id: "preset_promotions", name: "Promotions", query: "category:promotions newer_than:14d", createdAt: now, updatedAt: now },
];

interface SettingsState {
    commandPaletteTheme: CommandPaletteTheme;
    quoteVibe: QuoteVibe;
    bookmarks: Bookmark[];
    apiWidgets: ApiWidgetInstance[];
    gmail: GmailSettings;
    gmailPresets: GmailPreset[];
    dashboardEditMode: boolean;
    setCommandPaletteTheme: (theme: CommandPaletteTheme) => void;
    setQuoteVibe: (vibe: QuoteVibe) => void;
    addBookmark: (title: string, url: string) => void;
    deleteBookmark: (id: string) => void;
    addApiWidget: (widget: Omit<ApiWidgetInstance, "id">) => void;
    updateApiWidget: (id: string, updates: Partial<ApiWidgetInstance>) => void;
    deleteApiWidget: (id: string) => void;
    setGmailSettings: (partial: Partial<GmailSettings>) => void;
    resetGmailSettings: () => void;
    addGmailPreset: (name: string, query: string) => string;
    deleteGmailPreset: (id: string) => void;
    updateGmailPreset: (id: string, updates: { name?: string; query?: string }) => void;
    applyGmailPreset: (id: string) => void;
    toggleDashboardEditMode: () => void;
    setDashboardEditMode: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            commandPaletteTheme: "default",
            quoteVibe: "motivational",
            bookmarks: [
                { id: "bk1", title: "GitHub", url: "https://github.com" },
                { id: "bk2", title: "StackOverflow", url: "https://stackoverflow.com" },
                { id: "bk3", title: "ChatGPT", url: "https://chat.openai.com" },
            ],
            apiWidgets: [],
            gmail: DEFAULT_GMAIL,
            gmailPresets: DEFAULT_GMAIL_PRESETS,
            dashboardEditMode: false,

            setCommandPaletteTheme: (theme) => set({ commandPaletteTheme: theme }),
            setQuoteVibe: (vibe) => set({ quoteVibe: vibe }),
            toggleDashboardEditMode: () => set((s) => ({ dashboardEditMode: !s.dashboardEditMode })),
            setDashboardEditMode: (value) => set({ dashboardEditMode: value }),

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

            setGmailSettings: (partial) =>
                set((s) => ({
                    gmail: { ...s.gmail, ...partial },
                })),

            resetGmailSettings: () => set({ gmail: DEFAULT_GMAIL }),

            addGmailPreset: (name, query) => {
                const trimName = name.trim();
                const trimQuery = query.trim();
                if (!trimName || !trimQuery) return "";
                const id = generateId();
                const t = Date.now();
                set((s) => ({
                    gmailPresets: [
                        ...s.gmailPresets,
                        { id, name: trimName, query: trimQuery, createdAt: t, updatedAt: t },
                    ],
                }));
                return id;
            },

            deleteGmailPreset: (id) =>
                set((s) => ({
                    gmailPresets: s.gmailPresets.filter((p) => p.id !== id),
                })),

            updateGmailPreset: (id, updates) =>
                set((s) => ({
                    gmailPresets: s.gmailPresets.map((p) =>
                        p.id === id
                            ? {
                                ...p,
                                ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
                                ...(updates.query !== undefined ? { query: updates.query.trim() } : {}),
                                updatedAt: Date.now(),
                            }
                            : p
                    ),
                })),

            applyGmailPreset: (id) => {
                const preset = get().gmailPresets.find((p) => p.id === id);
                if (!preset) return;
                set((s) => ({
                    gmail: { ...s.gmail, mode: "advanced", query: preset.query },
                }));
            },
        }),
        {
            name: "tbb-settings",
            merge: (persisted, current) => {
                const p = persisted as Partial<SettingsState> | undefined;
                const merged = { ...current, ...p };
                if (!merged.gmail) {
                    merged.gmail = DEFAULT_GMAIL;
                } else {
                    merged.gmail = { ...DEFAULT_GMAIL, ...merged.gmail };
                }
                // Backfill gmailPresets if missing
                if (!merged.gmailPresets || !Array.isArray(merged.gmailPresets)) {
                    merged.gmailPresets = DEFAULT_GMAIL_PRESETS;
                }
                // Migrate old gmailFilters key if present
                const legacy = p as Record<string, unknown> | undefined;
                if (legacy?.gmailFilters && !legacy.gmail) {
                    merged.gmail = { ...DEFAULT_GMAIL, ...(legacy.gmailFilters as Partial<GmailSettings>) };
                }
                return merged;
            },
        }
    )
);
