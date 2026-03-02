"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateId } from "@/lib/utils";
import { TemplatePreset, DEFAULT_TEMPLATES, DashboardSnapshot } from "@/lib/defaultTemplates";
import { sanitizeWidgets } from "@/lib/widgets/sanitizeWidgets";
import { useWidgetStore } from "@/store/useWidgetStore";
import { useNavigationStore } from "@/store/useNavigationStore";

interface TemplateState {
    templates: TemplatePreset[];
    addTemplate: (name: string, snapshot: DashboardSnapshot) => void;
    deleteTemplate: (id: string) => void;
    renameTemplate: (id: string, newName: string) => void;
    duplicateTemplate: (id: string) => void;
    resetTemplates: () => void;
    importTemplates: (json: string) => boolean;

    // Actions that interact with other stores
    createFromCurrent: (name: string) => void;
    applyTemplate: (id: string) => void;
}

export const useTemplateStore = create<TemplateState>()(
    persist(
        (set, get) => ({
            templates: [],

            addTemplate: (name, snapshot) => set((s) => ({
                templates: [...s.templates, {
                    id: `tpl_${generateId()}`,
                    name,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    snapshot
                }]
            })),

            deleteTemplate: (id) => set((s) => ({
                templates: s.templates.filter(t => t.id !== id)
            })),

            renameTemplate: (id, newName) => set((s) => ({
                templates: s.templates.map(t =>
                    t.id === id ? { ...t, name: newName, updatedAt: Date.now() } : t
                )
            })),

            duplicateTemplate: (id) => set((s) => {
                const limit = s.templates.find(t => t.id === id) || DEFAULT_TEMPLATES.find(t => t.id === id);
                if (!limit) return s;
                return {
                    templates: [...s.templates, {
                        ...limit,
                        id: `tpl_${generateId()}`,
                        name: `${limit.name} (Copy)`,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                        isDefault: false
                    }]
                };
            }),

            resetTemplates: () => set({ templates: [] }),

            importTemplates: (json) => {
                try {
                    const parsed = JSON.parse(json);
                    if (!Array.isArray(parsed)) return false;
                    // minimal validation
                    const valid = parsed.every(t => t.id && t.name && t.snapshot);
                    if (!valid) return false;

                    set((s) => ({
                        templates: [...s.templates, ...parsed.map((t: any) => ({
                            ...t,
                            id: `tpl_${generateId()}`,
                            isDefault: false
                        }))]
                    }));
                    return true;
                } catch (e) {
                    return false;
                }
            },

            createFromCurrent: (name) => {
                const wStore = useWidgetStore.getState();
                const nStore = useNavigationStore.getState();

                const snapshot: DashboardSnapshot = {
                    instances: wStore.instances,
                    layout: wStore.layout,
                    lockedGroups: wStore.lockedGroups,
                    activeTab: nStore.activeTab
                };

                get().addTemplate(name, snapshot);
            },

            applyTemplate: (id) => {
                const template = get().templates.find(t => t.id === id) || DEFAULT_TEMPLATES.find(t => t.id === id);
                if (!template) return;

                // Default templates use buildSnapshot() to generate fresh IDs on every apply,
                // preventing collisions with stale persisted store data.
                // User-created templates use the static .snapshot field.
                const snapshot = template.buildSnapshot
                    ? template.buildSnapshot()
                    : template.snapshot;

                if (!snapshot) return;

                // Sanitize before applying — removes stale types, orphan IDs, duplicates
                const { instances, layout } = sanitizeWidgets(snapshot.instances, snapshot.layout);

                if (process.env.NODE_ENV === "development") {
                    console.log("[applyTemplate] Applying template:", template.name, {
                        rawCount: snapshot.layout.length,
                        cleanCount: layout.length,
                    });
                }

                // 1. replace widget state
                useWidgetStore.getState().replaceDashboardState({
                    instances,
                    layout,
                    lockedGroups: snapshot.lockedGroups
                });

                // 2. restore active tab if present
                if (snapshot.activeTab) {
                    useNavigationStore.getState().setActiveTab(snapshot.activeTab);
                }
            }
        }),
        {
            name: "tbb-templates",
        }
    )
);
