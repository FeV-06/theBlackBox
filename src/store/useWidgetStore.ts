"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WidgetType, WidgetInstance } from "@/types/widgetInstance";
import { generateId } from "@/lib/utils";

/* ─── Helpers ─── */

function createInstance(type: WidgetType, overrides?: Partial<WidgetInstance>): WidgetInstance {
    const now = Date.now();
    return {
        instanceId: overrides?.instanceId ?? generateId(),
        type,
        enabled: true,
        createdAt: now,
        updatedAt: now,
        config: {},
        ...overrides,
    };
}

/* ─── Default instances (mirrors the old DEFAULT_ORDER) ─── */

const OLD_TYPE_MAP: Record<string, WidgetType> = {
    quote_clock: "quote_clock",
    todo: "todo",
    habits: "habit_tracker",  // old id → new type
    github: "github",
    weather: "weather",
    links: "quick_links",     // old id → new type
    focus_summary: "focus_summary",
    projects_overview: "projects_overview",
    custom_api: "custom_api",
    gmail: "gmail",
};

const DEFAULT_TYPES: WidgetType[] = [
    "quote_clock",
    "todo",
    "habit_tracker",
    "github",
    "weather",
    "quick_links",
    "focus_summary",
    "projects_overview",
    "custom_api",
    "gmail",
];

function buildDefaults(): { instances: Record<string, WidgetInstance>; layout: string[] } {
    const instances: Record<string, WidgetInstance> = {};
    const layout: string[] = [];
    for (const type of DEFAULT_TYPES) {
        const id = `${type}_default`;
        instances[id] = createInstance(type, { instanceId: id });
        layout.push(id);
    }
    return { instances, layout };
}

const DEFAULTS = buildDefaults();

/* ─── Store interface ─── */

interface WidgetState {
    instances: Record<string, WidgetInstance>;
    layout: string[];

    addInstance: (type: WidgetType, config?: Record<string, unknown>) => string;
    removeInstance: (instanceId: string) => void;
    toggleInstance: (instanceId: string) => void;
    renameInstance: (instanceId: string, title: string) => void;
    duplicateInstance: (instanceId: string) => string;
    updateInstanceConfig: (instanceId: string, partialConfig: Record<string, unknown>) => void;
    reorder: (activeId: string, overId: string) => void;
    resetToDefaults: () => void;
}

/* ─── Migrate v0 → v1 ─── */

interface V0State {
    order?: string[];
    enabled?: Record<string, boolean>;
}

function migrateV0toV1(old: V0State): Pick<WidgetState, "instances" | "layout"> {
    const oldOrder = old.order ?? Object.keys(OLD_TYPE_MAP);
    const oldEnabled = old.enabled ?? {};

    const instances: Record<string, WidgetInstance> = {};
    const layout: string[] = [];

    for (const oldId of oldOrder) {
        const type = OLD_TYPE_MAP[oldId];
        if (!type) continue; // skip unknown widgets
        const instanceId = `${type}_default`;
        const enabled = oldEnabled[oldId] ?? true;
        instances[instanceId] = createInstance(type, { instanceId, enabled });
        layout.push(instanceId);
    }

    // Backfill any missing types
    for (const type of DEFAULT_TYPES) {
        const defId = `${type}_default`;
        if (!instances[defId]) {
            instances[defId] = createInstance(type, { instanceId: defId });
            layout.push(defId);
        }
    }

    return { instances, layout };
}

/* ─── Zustand store ─── */

export const useWidgetStore = create<WidgetState>()(
    persist(
        (set, get) => ({
            instances: DEFAULTS.instances,
            layout: DEFAULTS.layout,

            addInstance: (type, config) => {
                const id = generateId();
                const inst = createInstance(type, {
                    instanceId: id,
                    config: config ?? {},
                });
                set((s) => ({
                    instances: { ...s.instances, [id]: inst },
                    layout: [...s.layout, id],
                }));
                return id;
            },

            removeInstance: (instanceId) =>
                set((s) => {
                    const { [instanceId]: _, ...rest } = s.instances;
                    return {
                        instances: rest,
                        layout: s.layout.filter((id) => id !== instanceId),
                    };
                }),

            toggleInstance: (instanceId) =>
                set((s) => {
                    const inst = s.instances[instanceId];
                    if (!inst) return s;
                    return {
                        instances: {
                            ...s.instances,
                            [instanceId]: { ...inst, enabled: !inst.enabled, updatedAt: Date.now() },
                        },
                    };
                }),

            renameInstance: (instanceId, title) =>
                set((s) => {
                    const inst = s.instances[instanceId];
                    if (!inst) return s;
                    return {
                        instances: {
                            ...s.instances,
                            [instanceId]: { ...inst, title: title.trim() || undefined, updatedAt: Date.now() },
                        },
                    };
                }),

            duplicateInstance: (instanceId) => {
                const inst = get().instances[instanceId];
                if (!inst) return "";
                const newId = generateId();
                const clone: WidgetInstance = {
                    ...inst,
                    instanceId: newId,
                    title: inst.title ? `${inst.title} (copy)` : undefined,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    config: { ...inst.config },
                };
                set((s) => {
                    const idx = s.layout.indexOf(instanceId);
                    const newLayout = [...s.layout];
                    newLayout.splice(idx + 1, 0, newId);
                    return {
                        instances: { ...s.instances, [newId]: clone },
                        layout: newLayout,
                    };
                });
                return newId;
            },

            updateInstanceConfig: (instanceId, partialConfig) =>
                set((s) => {
                    const inst = s.instances[instanceId];
                    if (!inst) return s;
                    return {
                        instances: {
                            ...s.instances,
                            [instanceId]: {
                                ...inst,
                                config: { ...inst.config, ...partialConfig },
                                updatedAt: Date.now(),
                            },
                        },
                    };
                }),

            reorder: (activeId, overId) =>
                set((s) => {
                    const oldIndex = s.layout.indexOf(activeId);
                    const newIndex = s.layout.indexOf(overId);
                    if (oldIndex === -1 || newIndex === -1) return s;
                    const newLayout = [...s.layout];
                    newLayout.splice(oldIndex, 1);
                    newLayout.splice(newIndex, 0, activeId);
                    return { layout: newLayout };
                }),

            resetToDefaults: () => set({ ...buildDefaults() }),
        }),
        {
            name: "tbb-widgets",
            version: 1,
            migrate: (persisted, version) => {
                if (version === 0 || version === undefined) {
                    // Migrate v0 (old order/enabled format) → v1 (instances/layout)
                    const migrated = migrateV0toV1(persisted as V0State);
                    return { ...migrated };
                }
                return persisted as WidgetState;
            },
        }
    )
);
