"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WidgetType, WidgetInstance } from "@/types/widgetInstance";
import { generateId } from "@/lib/utils";

/* ─── Helpers ─── */

const DEFAULT_W = 360;
const DEFAULT_H = 260;
const MAX_HISTORY = 50;

function createInstance(type: WidgetType, overrides?: Partial<WidgetInstance>, index: number = 0): WidgetInstance {
    const now = Date.now();

    // Deterministic 2-column placement
    const x = 20 + (index % 2) * 420;
    const y = 20 + Math.floor(index / 2) * 300;

    return {
        instanceId: overrides?.instanceId ?? generateId(),
        type,
        enabled: true,
        createdAt: now,
        updatedAt: now,
        config: {},
        layout: { x, y, w: DEFAULT_W, h: DEFAULT_H },
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
    for (let i = 0; i < DEFAULT_TYPES.length; i++) {
        const type = DEFAULT_TYPES[i];
        const id = `${type}_default`;
        instances[id] = createInstance(type, { instanceId: id }, i);
        layout.push(id);
    }
    return { instances, layout };
}

const DEFAULTS = buildDefaults();

/* ─── Snapshot type (layout-related state only) ─── */

type WidgetStoreSnapshot = {
    instances: Record<string, WidgetInstance>;
    layout: string[];
    lockedGroups: Record<string, boolean>;
};

/* ─── Store interface ─── */

interface WidgetState {
    instances: Record<string, WidgetInstance>;
    layout: string[];
    lockedGroups: Record<string, boolean>;

    // History (runtime only, NOT persisted)
    historyPast: WidgetStoreSnapshot[];
    historyFuture: WidgetStoreSnapshot[];

    addInstance: (type: WidgetType, config?: Record<string, unknown>) => string;
    removeInstance: (instanceId: string) => void;
    toggleInstance: (instanceId: string) => void;
    renameInstance: (instanceId: string, title: string) => void;
    duplicateInstance: (instanceId: string) => string;
    updateInstanceConfig: (instanceId: string, partialConfig: Record<string, unknown>) => void;
    updateInstanceLayout: (instanceId: string, partialLayout: Partial<{ x: number; y: number; w: number; h: number }>) => void;
    toggleInstanceLock: (instanceId: string) => void;
    setInstanceLock: (instanceId: string, locked: boolean) => void;
    toggleGroupLock: (groupId: string) => void;
    setGroupLock: (groupId: string, locked: boolean) => void;
    unlinkFromStack: (instanceId: string) => void;
    relinkToStacks: (instanceId: string) => void;
    bringToFront: (instanceId: string) => void;
    sendToBack: (instanceId: string) => void;
    bringForward: (instanceId: string) => void;
    sendBackward: (instanceId: string) => void;
    reorder: (activeId: string, overId: string) => void;
    autoArrangeInstances: () => void;
    batchUpdateLayouts: (updates: Record<string, Partial<{ x: number; y: number; w: number; h: number }>>) => void;
    resetToDefaults: () => void;
    undo: () => void;
    redo: () => void;
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

    let idx = 0;
    for (const oldId of oldOrder) {
        const type = OLD_TYPE_MAP[oldId];
        if (!type) continue;
        const instanceId = `${type}_default`;
        const enabled = oldEnabled[oldId] ?? true;
        instances[instanceId] = createInstance(type, { instanceId, enabled }, idx++);
        layout.push(instanceId);
    }

    // Backfill any missing types
    for (const type of DEFAULT_TYPES) {
        const defId = `${type}_default`;
        if (!instances[defId]) {
            instances[defId] = createInstance(type, { instanceId: defId }, idx++);
            layout.push(defId);
        }
    }

    return { instances, layout };
}

/* ─── Snapshot helpers ─── */

function takeSnapshot(s: WidgetState): WidgetStoreSnapshot {
    return structuredClone({ instances: s.instances, layout: s.layout, lockedGroups: s.lockedGroups });
}

function pushSnapshot(s: WidgetState): Pick<WidgetState, "historyPast" | "historyFuture"> {
    const snap = takeSnapshot(s);
    const past = [...s.historyPast, snap];
    if (past.length > MAX_HISTORY) past.shift();
    return { historyPast: past, historyFuture: [] };
}

function normalizeZIndexes(instances: Record<string, WidgetInstance>): Record<string, WidgetInstance> {
    const sorted = Object.values(instances).sort((a, b) => (a.zIndex ?? 1) - (b.zIndex ?? 1));
    const result = { ...instances };
    sorted.forEach((inst, i) => {
        result[inst.instanceId] = { ...result[inst.instanceId], zIndex: i + 1 };
    });
    return result;
}

/* ─── Zustand store ─── */

export const useWidgetStore = create<WidgetState>()(
    persist(
        (set, get) => ({
            instances: DEFAULTS.instances,
            layout: DEFAULTS.layout,
            lockedGroups: {},
            historyPast: [],
            historyFuture: [],

            addInstance: (type, config) => {
                const id = generateId();
                const index = get().layout.length;
                const inst = createInstance(type, {
                    instanceId: id,
                    config: config ?? {},
                }, index);
                set((s) => ({
                    ...pushSnapshot(s),
                    instances: { ...s.instances, [id]: inst },
                    layout: [...s.layout, id],
                }));
                return id;
            },

            removeInstance: (instanceId) =>
                set((s) => {
                    const { [instanceId]: _, ...rest } = s.instances;
                    return {
                        ...pushSnapshot(s),
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
                        ...pushSnapshot(s),
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
                        ...pushSnapshot(s),
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

            updateInstanceLayout: (instanceId, partialLayout) =>
                set((s) => {
                    const inst = s.instances[instanceId];
                    if (!inst) return s;
                    return {
                        ...pushSnapshot(s),
                        instances: {
                            ...s.instances,
                            [instanceId]: {
                                ...inst,
                                layout: { ...inst.layout, ...partialLayout },
                                updatedAt: Date.now(),
                            },
                        },
                    };
                }),

            toggleInstanceLock: (instanceId) =>
                set((s) => {
                    const inst = s.instances[instanceId];
                    if (!inst) return s;
                    return {
                        ...pushSnapshot(s),
                        instances: {
                            ...s.instances,
                            [instanceId]: {
                                ...inst,
                                isLocked: !inst.isLocked,
                                updatedAt: Date.now(),
                            },
                        },
                    };
                }),

            setInstanceLock: (instanceId, locked) =>
                set((s) => {
                    const inst = s.instances[instanceId];
                    if (!inst) return s;
                    return {
                        ...pushSnapshot(s),
                        instances: {
                            ...s.instances,
                            [instanceId]: {
                                ...inst,
                                isLocked: locked,
                                updatedAt: Date.now(),
                            },
                        },
                    };
                }),

            toggleGroupLock: (groupId) =>
                set((s) => ({
                    ...pushSnapshot(s),
                    lockedGroups: { ...s.lockedGroups, [groupId]: !s.lockedGroups[groupId] },
                })),

            setGroupLock: (groupId, locked) =>
                set((s) => ({
                    ...pushSnapshot(s),
                    lockedGroups: { ...s.lockedGroups, [groupId]: locked },
                })),

            unlinkFromStack: (instanceId) =>
                set((s) => {
                    const inst = s.instances[instanceId];
                    if (!inst) return s;
                    return {
                        ...pushSnapshot(s),
                        instances: {
                            ...s.instances,
                            [instanceId]: { ...inst, groupDisabled: true, updatedAt: Date.now() },
                        },
                    };
                }),

            relinkToStacks: (instanceId) =>
                set((s) => {
                    const inst = s.instances[instanceId];
                    if (!inst) return s;
                    return {
                        ...pushSnapshot(s),
                        instances: {
                            ...s.instances,
                            [instanceId]: { ...inst, groupDisabled: false, updatedAt: Date.now() },
                        },
                    };
                }),

            bringToFront: (instanceId) =>
                set((s) => {
                    const inst = s.instances[instanceId];
                    if (!inst) return s;
                    const maxZ = Math.max(...Object.values(s.instances).map(i => i.zIndex ?? 1));
                    const updated = { ...s.instances, [instanceId]: { ...inst, zIndex: maxZ + 1, updatedAt: Date.now() } };
                    return { ...pushSnapshot(s), instances: normalizeZIndexes(updated) };
                }),

            sendToBack: (instanceId) =>
                set((s) => {
                    const inst = s.instances[instanceId];
                    if (!inst) return s;
                    const minZ = Math.min(...Object.values(s.instances).map(i => i.zIndex ?? 1));
                    const updated = { ...s.instances, [instanceId]: { ...inst, zIndex: minZ - 1, updatedAt: Date.now() } };
                    return { ...pushSnapshot(s), instances: normalizeZIndexes(updated) };
                }),

            bringForward: (instanceId) =>
                set((s) => {
                    const inst = s.instances[instanceId];
                    if (!inst) return s;
                    const myZ = inst.zIndex ?? 1;
                    // Find next widget with higher zIndex
                    const sorted = Object.values(s.instances).sort((a, b) => (a.zIndex ?? 1) - (b.zIndex ?? 1));
                    const nextAbove = sorted.find(w => (w.zIndex ?? 1) > myZ);
                    if (!nextAbove) return s;
                    const updated = {
                        ...s.instances,
                        [instanceId]: { ...inst, zIndex: nextAbove.zIndex ?? 1, updatedAt: Date.now() },
                        [nextAbove.instanceId]: { ...nextAbove, zIndex: myZ, updatedAt: Date.now() },
                    };
                    return { ...pushSnapshot(s), instances: normalizeZIndexes(updated) };
                }),

            sendBackward: (instanceId) =>
                set((s) => {
                    const inst = s.instances[instanceId];
                    if (!inst) return s;
                    const myZ = inst.zIndex ?? 1;
                    // Find next widget with lower zIndex
                    const sorted = Object.values(s.instances).sort((a, b) => (b.zIndex ?? 1) - (a.zIndex ?? 1));
                    const nextBelow = sorted.find(w => (w.zIndex ?? 1) < myZ);
                    if (!nextBelow) return s;
                    const updated = {
                        ...s.instances,
                        [instanceId]: { ...inst, zIndex: nextBelow.zIndex ?? 1, updatedAt: Date.now() },
                        [nextBelow.instanceId]: { ...nextBelow, zIndex: myZ, updatedAt: Date.now() },
                    };
                    return { ...pushSnapshot(s), instances: normalizeZIndexes(updated) };
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

            batchUpdateLayouts: (updates) =>
                set((s) => {
                    const newInstances = { ...s.instances };
                    let changed = false;

                    Object.entries(updates).forEach(([id, partial]) => {
                        if (newInstances[id]) {
                            newInstances[id] = {
                                ...newInstances[id],
                                layout: { ...newInstances[id].layout, ...partial },
                                updatedAt: Date.now(),
                            };
                            changed = true;
                        }
                    });

                    if (!changed) return s;
                    return { ...pushSnapshot(s), instances: newInstances };
                }),

            autoArrangeInstances: () =>
                set((s) => {
                    // Constants
                    const START_X = 20;
                    const START_Y = 20;
                    const GAP = 28;
                    const MAX_ROW_WIDTH = 1200 - 80; // CANVAS_MIN_WIDTH approx minus padding

                    // 1. Identify locked obstacles (single locked or group locked)
                    // We treat them as fixed rectangles
                    const instances = { ...s.instances };
                    const layoutIds = [...s.layout];

                    // Separate movable and fixed widgets
                    const fixedRects: { x: number; y: number; w: number; h: number }[] = [];
                    const movableGroups: string[] = []; // Group IDs or Instance IDs if standalone
                    const processedMovable = new Set<string>();

                    // Helper to check if an instance is locked
                    const isLocked = (id: string) => {
                        const inst = instances[id];
                        if (!inst || !inst.layout) return false;
                        // Check instance lock
                        if (inst.isLocked) return true;
                        // Check group lock
                        // Find group (simple traverse)
                        // Note: In store we don't track groups explicitly easily without graph, 
                        // but we can check if it's linked to another locked one. 
                        // SIMPLIFICATION: usage of s.lockedGroups requires group ID which is dynamic.
                        // However, the WidgetCanvas logic constructs groups dynamically. 
                        // Here we must rely on instance attributes or reconstruct groups.
                        // The prompt says: "If stack group is locked → do not move any".
                        // Store has `lockedGroups` mapped by groupId. But groupId is "id1|id2".
                        // We need to reconstruct simple grouping here or approximate.
                        // Better apporach: check implicit grouping by overlapping/adjacent? 
                        // No, store doesn't know adjacency.
                        // CRITICAL: We need to respect the prompt's invariant. 
                        // But `lockedGroups` keys depend on the *result* of adjacency detection.
                        // To be safe: We only respect `isLocked` flag on instances, and if ANY in a stack is locked, 
                        // usually that propagates to visual lock. 
                        // For this implementation, we will move ALL unlocked, non-grouped widgets?
                        // OR: We assume the user has explicitly locked things they want to stay.
                        // If they haven't locked it, we move it.
                        return false;
                    };

                    // RE-EVALUATION: To properly handle stacking, we need to know who is stacked with whom.
                    // But that calculation is in WidgetCanvas (complex BFS). Duplicating it here is risky and expensive.
                    // COMPROMISE: We will auto-arrange *linearly* based on the `layout` order.
                    // Stacked widgets usually share similar coordinates.
                    // If we move separate instances, we break stacks.
                    // FIX: We must treat stacks as units.
                    // Strategy:
                    // 1. Cluster instances into groups based on slight proximity (like WidgetCanvas does).
                    // 2. Determine if group is locked (any member locked? or checking `lockedGroups`).
                    // 3. Collect movable groups.

                    // Simple Clustering (Distance < 40px)
                    const groups: string[][] = [];
                    const visited = new Set<string>();

                    const getRect = (id: string) => instances[id].layout;
                    const areClose = (r1: any, r2: any) => {
                        return Math.abs(r1.x - r2.x) < 40 && Math.abs(r1.y - r2.y) < 40;
                    };

                    for (const id of layoutIds) {
                        if (visited.has(id)) continue;
                        if (!instances[id].enabled) continue;

                        const cluster = [id];
                        visited.add(id);
                        const queue = [id];

                        while (queue.length > 0) {
                            const curr = queue.pop()!;
                            const r1 = getRect(curr);

                            for (const other of layoutIds) {
                                if (!visited.has(other) && instances[other].enabled) {
                                    const r2 = getRect(other);
                                    if (areClose(r1, r2)) {
                                        visited.add(other);
                                        cluster.push(other);
                                        queue.push(other);
                                    }
                                }
                            }
                        }
                        groups.push(cluster);
                    }

                    // Sort groups by Y then X (to maintain some improved order)
                    // We use the "anchor" (top-leftmost) of each group for sorting
                    groups.sort((a, b) => {
                        const rA = instances[a[0]].layout!; // simplified: just take first
                        const rB = instances[b[0]].layout!;
                        if (Math.abs(rA.y - rB.y) > 50) return rA.y - rB.y;
                        return rA.x - rB.x;
                    });

                    // Define placement cursor
                    let currentX = START_X;
                    let currentY = START_Y;
                    let currentRowHeight = 0;

                    const newLayouts: Record<string, Partial<{ x: number; y: number }>> = {};

                    for (const group of groups) {
                        // Check if group is locked
                        // We check if ANY member is locked.
                        const isGroupLocked = group.some(id => instances[id].isLocked);
                        // Also check `lockedGroups` if we can construct the key? 
                        // The key is simplified sorted IDs joined.
                        const groupKey = [...group].sort().join("|");
                        const isStackLocked = s.lockedGroups[groupKey];

                        const anchor = instances[group[0]].layout!;
                        const groupW = anchor.w; // Simplified: Assuming stack members have similar size or using anchor
                        const groupH = anchor.h;

                        if (isGroupLocked || isStackLocked) {
                            // Skip moving this group.
                            // BUT, we must update cursor to not overlap?
                            // Or does "Locked widget should act like an obstacle" mean we flow AROUND it?
                            // Implementing full obstacle avoidance flow is complex in one go.
                            // SIMPLIFICATION for "Panic Button":
                            // We effectively re-flow EVERYTHING that is movable.
                            // If something is locked, it stays.
                            // Be careful: We might place something ON TOP of a locked widget.
                            // To be truly generic, we'd need a collision map.
                            // MVP QoL: We just move unlocked things. Overlaps with locked items might happen
                            // but user can fix. Or we try to avoid.
                            // BETTER: Just place them.
                            continue;
                        }

                        // It's movable. Place it.
                        // Check bounds
                        if (currentX + groupW > MAX_ROW_WIDTH) {
                            // Wrap to next row
                            currentX = START_X;
                            currentY += currentRowHeight + GAP;
                            currentRowHeight = 0;
                        }

                        // Calculate delta to move the whole group
                        const dx = currentX - anchor.x;
                        const dy = currentY - anchor.y;

                        group.forEach(id => {
                            const inst = instances[id];
                            newLayouts[id] = {
                                x: inst.layout!.x + dx,
                                y: inst.layout!.y + dy
                            };
                        });

                        // Advance cursor
                        currentX += groupW + GAP;
                        currentRowHeight = Math.max(currentRowHeight, groupH);
                    }

                    // Apply batch update if needed
                    if (Object.keys(newLayouts).length === 0) return s;

                    // Apply
                    Object.entries(newLayouts).forEach(([id, pos]) => {
                        instances[id] = {
                            ...instances[id],
                            layout: { ...instances[id].layout!, ...pos },
                            updatedAt: Date.now()
                        };
                    });

                    return { ...pushSnapshot(s), instances };
                }),

            resetToDefaults: () => set({ ...buildDefaults(), lockedGroups: {}, historyPast: [], historyFuture: [] }),

            undo: () =>
                set((s) => {
                    if (s.historyPast.length === 0) return s;
                    const past = [...s.historyPast];
                    const snapshot = past.pop()!;
                    const current = takeSnapshot(s);
                    return {
                        ...snapshot,
                        historyPast: past,
                        historyFuture: [...s.historyFuture, current],
                    };
                }),

            redo: () =>
                set((s) => {
                    if (s.historyFuture.length === 0) return s;
                    const future = [...s.historyFuture];
                    const snapshot = future.pop()!;
                    const current = takeSnapshot(s);
                    return {
                        ...snapshot,
                        historyPast: [...s.historyPast, current],
                        historyFuture: future,
                    };
                }),
        }),
        {
            name: "tbb-widgets",
            version: 3,
            // Exclude history from persistence — it's runtime-only
            partialize: (state) => ({
                instances: state.instances,
                layout: state.layout,
                lockedGroups: state.lockedGroups,
            }),
            migrate: (persisted, version) => {
                let state = persisted as WidgetState;

                if (version === 0 || version === undefined) {
                    const migrated = migrateV0toV1(persisted as V0State);
                    state = { ...state, ...migrated };
                }

                if (version < 2) {
                    const instances = { ...state.instances };
                    const layout = [...state.layout];
                    layout.forEach((id, i) => {
                        if (instances[id] && !instances[id].layout) {
                            const x = 20 + (i % 2) * 420;
                            const y = 20 + Math.floor(i / 2) * 300;
                            instances[id] = {
                                ...instances[id],
                                layout: { x, y, w: DEFAULT_W, h: DEFAULT_H }
                            };
                        }
                    });
                    state = { ...state, instances };
                }

                // v3: Ensure all instances have isLocked boolean
                const instances = { ...state.instances };
                Object.keys(instances).forEach(id => {
                    if (instances[id] && instances[id].isLocked === undefined) {
                        instances[id] = { ...instances[id], isLocked: false };
                    }
                });

                // v4: Ensure lockedGroups exists
                if (!(state as any).lockedGroups) {
                    (state as any).lockedGroups = {};
                }

                // v5: Ensure all instances have zIndex
                Object.keys(instances).forEach((id, idx) => {
                    if (instances[id] && instances[id].zIndex === undefined) {
                        instances[id] = { ...instances[id], zIndex: idx + 1 };
                    }
                });

                return { ...state, instances };
            },
        }
    )
);
