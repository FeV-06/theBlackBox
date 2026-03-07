"use client";

import { create } from "zustand"; // Assuming "zustant" was a typo and keeping "zustand"
import { persist, createJSONStorage } from "zustand/middleware";
import type { WidgetType, WidgetInstance, WidgetTypeDefinition, TodoItem } from "@/types/widgetInstance";
import { generateId } from "@/lib/utils";
import { sanitizeWidgets } from "@/lib/widgets/sanitizeWidgets";
import {
    createCalendarEventFromTask,
    updateCalendarEventFromTask,
    deleteCalendarEvent
} from "@/lib/todoCalendarSync";
import type { WidgetManifest } from "@/widgets/types";
import type { HealthStatusType } from "@/components/widgets/engine/WidgetHealthContext";

export type HealthEvent = {
    status: HealthStatusType;
    timestamp: number;
    message?: string;
};


/* ─── Helpers ─── */

const DEFAULT_W = 360;
const DEFAULT_H = 260;
const MAX_HISTORY = 50;

function createInstance(type: WidgetType, overrides?: Partial<WidgetInstance>, index: number = 0): WidgetInstance {
    const now = Date.now();

    // Deterministic 2-column placement
    const x = 20 + (index % 2) * 420;
    const y = 20 + Math.floor(index / 2) * 300;

    const w = overrides?.layout?.w ?? (type === "section_divider" ? 360 : DEFAULT_W);
    const h = overrides?.layout?.h ?? (type === "section_divider" ? 60 : DEFAULT_H);

    return {
        instanceId: overrides?.instanceId ?? generateId(),
        type,
        enabled: true,
        createdAt: now,
        updatedAt: now,
        config: {},
        layout: { x, y, w, h },
        ...overrides,
    };
}

/* ─── Default instances (mirrors the old DEFAULT_ORDER) ─── */

const OLD_TYPE_MAP: Record<string, WidgetType> = {
    quote_clock: "quote_clock",
    todo: "todo",
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
    "github",
    "weather",
    "quick_links",
    "focus_summary",
    "projects_overview",
    "custom_api",
    "gmail",
    "insights",
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

    // Registry (runtime only, NOT persisted)
    registry: Map<string, WidgetManifest>;
    addManifestToRegistry: (manifest: WidgetManifest) => void;

    // Health Tracking (persisted)
    healthHistory: Record<string, HealthEvent[]>;
    reportHealth: (widgetId: string, status: HealthStatusType, message?: string) => void;

    // History (runtime only, NOT persisted)
    historyPast: WidgetStoreSnapshot[];
    historyFuture: WidgetStoreSnapshot[];

    addInstance: (type: WidgetType, config?: Record<string, unknown>) => string;
    registerExternalWidget: (inst: WidgetInstance) => void;
    removeInstance: (instanceId: string) => void;
    toggleInstance: (instanceId: string) => void;
    renameInstance: (instanceId: string, title: string) => void;
    duplicateInstance: (instanceId: string) => string;
    updateInstanceConfig: (instanceId: string, partialConfig: Record<string, unknown>) => void;
    updateInstanceLayout: (instanceId: string, partialLayout: Partial<{ x: number; y: number; w: number; h: number }>) => void;
    toggleInstanceLock: (instanceId: string) => void;
    // V1.1 Collapse Actions
    toggleCollapse: (instanceId: string) => void;
    setInstanceCollapse: (instanceId: string, collapsed: boolean) => void;
    collapseAll: () => void;
    expandAll: () => void;
    setInstanceLock: (instanceId: string, locked: boolean) => void;
    // Stack Actions
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
    replaceDashboardState: (snapshot: WidgetStoreSnapshot) => void;

    // Todo Actions
    addTodo: (instanceId: string, text: string) => void;
    toggleTodo: (instanceId: string, todoId: string) => void;
    deleteTodo: (instanceId: string, todoId: string) => void;
    updateTodo: (instanceId: string, todoId: string, updates: Partial<TodoItem>) => void;
    reorderTodos: (instanceId: string, newOrder: TodoItem[]) => void;
    setTodoSortMode: (instanceId: string, sortMode: "manual" | "priority" | "dueDate") => void;

    // Multiple Canvases
    canvases: { id: string; name: string }[];
    layouts: Record<string, { order: string[]; positions: Record<string, { x: number; y: number; w: number; h: number }> }>;
    activeCanvasId: string;

    addCanvas: (name: string) => string;
    renameCanvas: (id: string, name: string) => void;
    deleteCanvas: (id: string) => void;
    switchCanvas: (id: string, direction?: number) => void;
    setSyncedCanvases: (canvases: { id: string; name: string }[], layouts: Record<string, { order: string[]; positions: Record<string, { x: number; y: number; w: number; h: number }> }>, activeCanvasId: string) => void;

    // Undo/Redo
    undo: () => void;
    redo: () => void;

    // Animation state
    canvasDirection: number;
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
    return {
        instances: s.instances,
        layout: s.layout,
        lockedGroups: s.lockedGroups
    };
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
        (set, get) => {
            // Helper to snap height to grid (e.g., 10px)
            const snap = (val: number) => Math.round(val / 10) * 10;

            // --- Sync Engine ---
            // We use a Map to track active update timeouts per task to throttle network requests.
            const updateQueue = new Map<string, NodeJS.Timeout>();

            // Helper to mutate a single todo in the store asynchronously (for resolved sync actions)
            function patchTodoSync(set: any, get: any, instanceId: string, todoId: string, updates: Partial<TodoItem>) {
                set((s: any) => {
                    const inst = s.instances[instanceId];
                    if (!inst || !inst.data?.todos) return s;
                    const todos = inst.data.todos.map((t: TodoItem) =>
                        t.id === todoId ? { ...t, ...updates } : t
                    );
                    return {
                        instances: {
                            ...s.instances,
                            [instanceId]: {
                                ...inst,
                                data: { ...inst.data, todos },
                            },
                        },
                    };
                });
            }

            return {
                instances: {},
                layout: [],
                lockedGroups: {},
                historyPast: [],
                historyFuture: [],

                // Registry
                registry: new Map<string, WidgetManifest>(),
                addManifestToRegistry: (manifest) =>
                    set((s) => {
                        const newRegistry = new Map(s.registry);
                        newRegistry.set(manifest.id, manifest);
                        return { registry: newRegistry };
                    }),

                // Health Tracking
                healthHistory: {},
                reportHealth: (widgetId, status, message) =>
                    set((s) => {
                        const history = s.healthHistory[widgetId] || [];
                        const lastEvent = history[history.length - 1];

                        // Deduplicate identical sequential states unless message changed
                        if (lastEvent?.status === status && lastEvent?.message === message) return s;

                        const newEvent: HealthEvent = {
                            status,
                            timestamp: Date.now(),
                            message
                        };

                        const newHistory = [...history, newEvent].slice(-10); // Keep last 10

                        return {
                            healthHistory: {
                                ...s.healthHistory,
                                [widgetId]: newHistory
                            }
                        };
                    }),

                // Multiple Canvases
                canvases: [{ id: "main", name: "Main Canvas" }],
                layouts: { "main": { order: [], positions: {} } },
                activeCanvasId: "main",
                canvasDirection: 0,

                addCanvas: (name) => {
                    const id = `canvas_${generateId()}`;
                    set((s) => ({
                        canvases: [...s.canvases, { id, name }],
                        layouts: { ...s.layouts, [id]: { order: [], positions: {} } }
                    }));
                    return id;
                },

                renameCanvas: (id, name) => set((s) => ({
                    canvases: s.canvases.map(c => c.id === id ? { ...c, name } : c)
                })),

                deleteCanvas: (id) => set((s) => {
                    if (s.canvases.length <= 1) return s;

                    const newCanvases = s.canvases.filter(c => c.id !== id);
                    const newLayouts = { ...s.layouts };
                    delete newLayouts[id];

                    if (s.activeCanvasId === id) {
                        const fallbackId = newCanvases[0].id;
                        const rawTarget = newLayouts[fallbackId];
                        const targetLayout = {
                            order: Array.isArray(rawTarget) ? rawTarget : (rawTarget?.order || []),
                            positions: (rawTarget && !Array.isArray(rawTarget)) ? (rawTarget.positions || {}) : {}
                        };

                        const updatedInstances = { ...s.instances };
                        Object.keys(targetLayout.positions).forEach(instId => {
                            if (updatedInstances[instId]) {
                                updatedInstances[instId] = {
                                    ...updatedInstances[instId],
                                    layout: targetLayout.positions[instId]
                                };
                            }
                        });

                        return {
                            canvases: newCanvases,
                            layouts: newLayouts,
                            activeCanvasId: fallbackId,
                            layout: [...targetLayout.order],
                            instances: updatedInstances
                        };
                    }

                    return { canvases: newCanvases, layouts: newLayouts };
                }),

                switchCanvas: (id, direction = 0) => {
                    const s = get();
                    if (s.activeCanvasId === id || !s.layouts[id]) return;

                    // 1. Capture current spatial positions
                    const currentPositions: Record<string, any> = {};
                    s.layout.forEach(instId => {
                        const inst = s.instances[instId];
                        if (inst?.layout) {
                            currentPositions[instId] = { ...inst.layout };
                        }
                    });

                    // 2. Prepare new layouts map
                    const updatedLayouts = {
                        ...s.layouts,
                        [s.activeCanvasId]: {
                            order: [...s.layout],
                            positions: currentPositions
                        }
                    };

                    // 3. Prepare target canvas data
                    const rawTarget = s.layouts[id];
                    const targetLayout = {
                        order: Array.isArray(rawTarget) ? rawTarget : (rawTarget?.order || []),
                        positions: (rawTarget && !Array.isArray(rawTarget)) ? (rawTarget.positions || {}) : {}
                    };
                    const updatedInstances = { ...s.instances };

                    // 4. Map target coordinates back to shared instances
                    Object.entries(targetLayout.positions).forEach(([instId, pos]) => {
                        if (updatedInstances[instId]) {
                            updatedInstances[instId] = {
                                ...updatedInstances[instId],
                                layout: pos as any
                            };
                        }
                    });

                    set({
                        ...pushSnapshot(s),
                        layouts: updatedLayouts,
                        activeCanvasId: id,
                        layout: [...targetLayout.order],
                        instances: updatedInstances,
                        canvasDirection: direction
                    });
                },

                setSyncedCanvases: (canvases, layouts, activeCanvasId) => set((s) => {
                    return {
                        canvases: canvases.length > 0 ? canvases : s.canvases,
                        layouts: layouts,
                        activeCanvasId: activeCanvasId
                    };
                }),

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

                registerExternalWidget: (inst) => {
                    const { instanceId: id } = inst;
                    set((s) => {
                        const newOrder = [...s.layout, id];
                        const activeId = s.activeCanvasId;
                        const activeLayout = s.layouts[activeId] ?? { order: [], positions: {} };
                        return {
                            ...pushSnapshot(s),
                            instances: { ...s.instances, [id]: inst },
                            layout: newOrder,
                            layouts: {
                                ...s.layouts,
                                [activeId]: {
                                    order: [...activeLayout.order, id],
                                    positions: {
                                        ...activeLayout.positions,
                                        [id]: { ...inst.layout },
                                    },
                                },
                            },
                        };
                    });
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
                    const s = get();
                    const inst = s.instances[instanceId];
                    if (!inst) return "";
                    const newId = generateId();
                    const clone: WidgetInstance = {
                        ...inst,
                        instanceId: newId,
                        title: inst.title ? `${inst.title} (copy)` : undefined,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                        config: structuredClone(inst.config),
                        layout: {
                            ...inst.layout,
                            x: inst.layout.x + 20,
                            y: inst.layout.y + 20,
                        }
                    };
                    set((s) => {
                        const idx = s.layout.indexOf(instanceId);
                        const newLayoutOrder = [...s.layout];
                        newLayoutOrder.splice(idx + 1, 0, newId);

                        const activeId = s.activeCanvasId;
                        const activeLayout = s.layouts[activeId] ?? { order: [], positions: {} };
                        const canvasIdx = activeLayout.order.indexOf(instanceId);
                        const newCanvasOrder = [...activeLayout.order];
                        if (canvasIdx !== -1) {
                            newCanvasOrder.splice(canvasIdx + 1, 0, newId);
                        } else {
                            newCanvasOrder.push(newId);
                        }

                        return {
                            ...pushSnapshot(s),
                            instances: { ...s.instances, [newId]: clone },
                            layout: newLayoutOrder,
                            layouts: {
                                ...s.layouts,
                                [activeId]: {
                                    order: newCanvasOrder,
                                    positions: {
                                        ...activeLayout.positions,
                                        [newId]: { ...clone.layout }
                                    }
                                }
                            }
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

                toggleCollapse: (instanceId) => {
                    const inst = get().instances[instanceId];
                    if (!inst) return;
                    get().setInstanceCollapse(instanceId, !inst.isCollapsed);
                },

                setInstanceCollapse: (instanceId, collapsed) =>
                    set((s) => {
                        const inst = s.instances[instanceId];
                        if (!inst || !inst.layout) return s;

                        // Avoid redundant updates
                        if ((inst.isCollapsed ?? false) === collapsed) return s;

                        const oldH = inst.layout.h;
                        const newH = collapsed ? 64 : (Math.round((inst.savedExpandedHeight ?? 280) / 10) * 10);
                        const dy = newH - oldH;

                        // Create a clone of instances to modify
                        const nextInstances = { ...s.instances };

                        // Update the target widget
                        nextInstances[instanceId] = {
                            ...inst,
                            isCollapsed: collapsed,
                            savedExpandedHeight: collapsed ? (inst.isCollapsed ? inst.savedExpandedHeight : Math.max(oldH, 180)) : inst.savedExpandedHeight,
                            collapsedHeight: 64,
                            layout: { ...inst.layout, h: newH },
                            updatedAt: Date.now(),
                        };

                        // Anchor Physics System
                        // Grab only visible/enabled widgets that have layouts
                        const activeWidgets = Object.values(s.instances).filter(w => w.enabled && w.layout);

                        // Helper to check horizontal overlap (column match)
                        const horizOverlap = (a: WidgetInstance, b: WidgetInstance) => {
                            // 10px forgiveness so side-by-side widgets don't act as intersecting obstacles
                            return (a.layout!.x + 10) < (b.layout!.x + b.layout!.w) &&
                                (a.layout!.x + a.layout!.w - 10) > b.layout!.x;
                        };

                        if (dy < 0) { // COLLAPSING (Moving Up)
                            // A widget only moves up if its "anchors" (widgets directly above it) move up.
                            // If it's anchored to multiple widgets, it can only move up as much as the *slowest* anchor.

                            // 1. Identify initial movers (widgets directly blocked by the collapsing widget)
                            // Sort by Y ascending to process top-to-bottom
                            // Use partial height (e.g. 0.4) so slightly sloppy drag overlaps are caught!
                            const sortedWidgets = activeWidgets
                                .filter(w => w.instanceId !== instanceId && w.layout!.y >= inst.layout!.y + (oldH * 0.4))
                                .sort((a, b) => a.layout!.y - b.layout!.y);

                            // We'll track the requested shift delta per widget
                            const shifts: Record<string, number> = {};

                            for (const w of sortedWidgets) {
                                // Find all anchors (widgets above this one that it horizontally overlaps with)
                                const anchors = activeWidgets.filter(potentialAnchor =>
                                    potentialAnchor.instanceId !== w.instanceId &&
                                    potentialAnchor.layout!.y + potentialAnchor.layout!.h <= w.layout!.y + 30 && // 30px forgiveness
                                    horizOverlap(w, potentialAnchor)
                                );

                                if (anchors.length === 0) continue; // No anchors = no movement

                                // Is the active collapsing widget one of its anchors?
                                const isDirectlyAnchoredToTarget = anchors.some(a => a.instanceId === instanceId);

                                // Determine max allowed upward shift
                                let maxAllowedUpwardShift = Math.abs(dy); // Try to full shift

                                for (const anchor of anchors) {
                                    if (anchor.instanceId === instanceId) {
                                        // The collapsing widget allows full shift
                                        continue;
                                    }

                                    // Check if this other anchor is shifting
                                    const anchorShift = shifts[anchor.instanceId] || 0;

                                    // If an anchor isn't moving (or moving less), we are constrained by it.
                                    // Geometric constraint: We can only move up until we hit the anchor.
                                    const distanceToAnchor = w.layout!.y - (anchor.layout!.y + anchor.layout!.h);

                                    // Allowed shift from this anchor = how much the anchor moved + the visual gap we have to it
                                    // The minimum allowed visual gap is 20px.
                                    const spareDistance = Math.max(0, distanceToAnchor - 20);
                                    maxAllowedUpwardShift = Math.min(maxAllowedUpwardShift, Math.abs(anchorShift) + spareDistance);
                                }

                                if (maxAllowedUpwardShift > 0) {
                                    shifts[w.instanceId] = -maxAllowedUpwardShift; // Negative for moving up
                                }
                            }

                            // Apply shifts
                            Object.entries(shifts).forEach(([id, shift]) => {
                                const w = nextInstances[id];
                                // Prevent weird minor pixel shifts, only move if shift is significant
                                if (Math.abs(shift) > 5) {
                                    nextInstances[id] = {
                                        ...w,
                                        layout: { ...w.layout!, y: w.layout!.y + shift },
                                        updatedAt: Date.now()
                                    };
                                }
                            });

                        } else if (dy > 0) { // EXPANDING (Pushing Down)
                            // A widget expands, mechanically "pushing" anything its bottom edge intersects

                            // Initialize "push zones", starting with the expanding widget
                            const pushers = [{
                                id: instanceId,
                                bottomEdge: inst.layout!.y + newH,
                                left: inst.layout!.x,
                                right: inst.layout!.x + inst.layout!.w
                            }];

                            // Sort others by Y to simulate cascade perfectly
                            const sortedWidgets = activeWidgets
                                .filter(w => w.instanceId !== instanceId && w.layout!.y >= inst.layout!.y)
                                .sort((a, b) => a.layout!.y - b.layout!.y);

                            const shifts: Record<string, number> = {};

                            for (const w of sortedWidgets) {
                                const wTop = w.layout!.y;

                                // See if any pusher intersects us horizontally and pushes into us vertically
                                let maxPushRequired = 0;

                                for (const pusher of pushers) {
                                    const overlapX = w.layout!.x < pusher.right && w.layout!.x + w.layout!.w > pusher.left;
                                    if (overlapX) {
                                        // A widget expands, dynamically pushing anything in its way.
                                        // The required push is whatever distance is needed to preserve a 20px gap
                                        const pushNeeded = Math.round(Math.max(0, pusher.bottomEdge + 20 - wTop));

                                        if (pushNeeded > 5) {
                                            maxPushRequired = Math.max(maxPushRequired, pushNeeded);
                                        }
                                    }
                                }

                                if (maxPushRequired > 0) {
                                    shifts[w.instanceId] = maxPushRequired;
                                    // This widget now becomes a pusher itself at its new hypothetical bottom edge
                                    pushers.push({
                                        id: w.instanceId,
                                        bottomEdge: w.layout!.y + w.layout!.h + maxPushRequired,
                                        left: w.layout!.x,
                                        right: w.layout!.x + w.layout!.w
                                    });
                                }
                            }

                            // Apply pushes
                            Object.entries(shifts).forEach(([id, shift]) => {
                                const w = nextInstances[id];
                                if (Math.abs(shift) > 5) {
                                    nextInstances[id] = {
                                        ...w,
                                        layout: { ...w.layout!, y: w.layout!.y + shift },
                                        updatedAt: Date.now()
                                    };
                                }
                            });
                        }

                        return {
                            ...pushSnapshot(s),
                            instances: nextInstances
                        };
                    }),

                collapseAll: () =>
                    set((s) => {
                        const instances = { ...s.instances };
                        let changed = false;
                        Object.keys(instances).forEach((id) => {
                            const inst = instances[id];
                            if (!inst.isCollapsed) {
                                instances[id] = {
                                    ...inst,
                                    isCollapsed: true,
                                    savedExpandedHeight: Math.max(inst.layout.h, 180),
                                    collapsedHeight: 64,
                                    layout: { ...inst.layout, h: 64 },
                                    updatedAt: Date.now(),
                                };
                                changed = true;
                            }
                        });
                        return changed ? { ...pushSnapshot(s), instances } : s;
                    }),

                expandAll: () =>
                    set((s) => {
                        const instances = { ...s.instances };
                        let changed = false;
                        Object.keys(instances).forEach((id) => {
                            const inst = instances[id];
                            if (inst.isCollapsed) {
                                const restoredH = inst.savedExpandedHeight ?? 280;
                                const finalH = Math.round(restoredH / 10) * 10;
                                instances[id] = {
                                    ...inst,
                                    isCollapsed: false,
                                    layout: { ...inst.layout, h: finalH },
                                    updatedAt: Date.now(),
                                };
                                changed = true;
                            }
                        });
                        return changed ? { ...pushSnapshot(s), instances } : s;
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

                replaceDashboardState: (snapshot) =>
                    set((s) => {
                        // 1. Validate snapshot
                        if (!snapshot || !snapshot.instances || !Array.isArray(snapshot.layout)) {
                            console.error("Invalid snapshot provided to replaceDashboardState");
                            return s;
                        }

                        // 2. Sanitize — remove stale types, orphan IDs, duplicates
                        const { instances: sanitizedInstances, layout: sanitizedLayout } =
                            sanitizeWidgets(snapshot.instances, snapshot.layout);

                        // 3. Normalize Z-Indexes
                        const sortedIds = [...sanitizedLayout].sort((a, b) => {
                            const zA = sanitizedInstances[a]?.zIndex ?? 0;
                            const zB = sanitizedInstances[b]?.zIndex ?? 0;
                            return zA - zB;
                        });

                        const newInstances = { ...sanitizedInstances };
                        sortedIds.forEach((id, index) => {
                            if (newInstances[id]) {
                                newInstances[id] = {
                                    ...newInstances[id],
                                    zIndex: index + 1,
                                    updatedAt: Date.now(),
                                };
                            }
                        });

                        // 4. Apply state
                        return {
                            ...pushSnapshot(s),
                            instances: newInstances,
                            layout: sanitizedLayout,
                            lockedGroups: snapshot.lockedGroups || {},
                        };
                    }),

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

                resetToDefaults: () => {
                    const id = generateId();
                    const inst = createInstance("quote_clock", { instanceId: id }, 0);
                    set({
                        instances: { [id]: inst },
                        layout: [id],
                        lockedGroups: {},
                        historyPast: [],
                        historyFuture: [],
                    });
                },

                // --- Todo Actions ---
                addTodo: (instanceId, text) => {
                    const newTodoId = generateId();
                    // Optimistic UI update
                    set((s) => {
                        const inst = s.instances[instanceId];
                        if (!inst) return s;
                        const currentTodos = inst.data?.todos || [];
                        const newTodo: TodoItem = {
                            id: newTodoId,
                            text,
                            completed: false,
                            priority: "low",
                            createdAt: Date.now(),
                            // New task starts idle
                            syncStatus: "idle",
                        };
                        return {
                            ...pushSnapshot(s),
                            instances: {
                                ...s.instances,
                                [instanceId]: {
                                    ...inst,
                                    data: {
                                        ...inst.data,
                                        todos: [...currentTodos, newTodo],
                                    },
                                    updatedAt: Date.now(),
                                },
                            },
                        };
                    });
                },

                toggleTodo: (instanceId, todoId) => {
                    set((s) => {
                        const sInst = s.instances[instanceId];
                        if (!sInst || !sInst.data?.todos) return s;
                        const todos = sInst.data.todos.map((t) =>
                            t.id === todoId ? { ...t, completed: !t.completed } : t
                        );
                        return {
                            ...pushSnapshot(s),
                            instances: {
                                ...s.instances,
                                [instanceId]: {
                                    ...sInst,
                                    data: { ...sInst.data, todos },
                                    updatedAt: Date.now(),
                                },
                            },
                        };
                    });
                },

                deleteTodo: (instanceId, todoId) => {
                    const inst = get().instances[instanceId];
                    if (!inst || !inst.data?.todos) return;

                    const todoToDelete = inst.data.todos.find(t => t.id === todoId);

                    set((s) => {
                        const sInst = s.instances[instanceId];
                        if (!sInst || !sInst.data?.todos) return s;
                        const todos = sInst.data.todos.filter((t) => t.id !== todoId);
                        return {
                            ...pushSnapshot(s),
                            instances: {
                                ...s.instances,
                                [instanceId]: {
                                    ...sInst,
                                    data: { ...sInst.data, todos },
                                    updatedAt: Date.now(),
                                },
                            },
                        };
                    });

                    // Background Sync Delete
                    if (todoToDelete?.linkedEventId) {
                        deleteCalendarEvent(todoToDelete.linkedEventId).catch(() => { });
                    }
                },

                updateTodo: (instanceId, todoId, updates) => {
                    const inst = get().instances[instanceId];
                    if (!inst || !inst.data?.todos) return;

                    const oldTodo = inst.data.todos.find(t => t.id === todoId);
                    if (!oldTodo) return;

                    // Optimistic UI Update first
                    set((s) => {
                        const sInst = s.instances[instanceId];
                        if (!sInst || !sInst.data?.todos) return s;

                        const mergedUpdates = { ...updates };
                        // If we are actively updating properties that might sync, mark pending
                        if (
                            "dueDate" in updates ||
                            "text" in updates ||
                            ("completed" in updates && !updates.completed) // toggle completion might need sync later but primarily text/date
                        ) {
                            // Determine if we actually need a sync state change for the UI right now
                            // If it currently has a link or is getting a valid date
                            if (oldTodo.linkedEventId || updates.dueDate !== undefined) {
                                mergedUpdates.syncStatus = "pending";
                            }
                        }

                        const todos = sInst.data.todos.map((t) =>
                            t.id === todoId ? { ...t, ...mergedUpdates } : t
                        );
                        return {
                            ...pushSnapshot(s),
                            instances: {
                                ...s.instances,
                                [instanceId]: {
                                    ...sInst,
                                    data: { ...sInst.data, todos },
                                    updatedAt: Date.now(),
                                },
                            },
                        };
                    });

                    // Evaluate Delta for Syncing (Debounced)
                    const newTodo = { ...oldTodo, ...updates };

                    // Case A: Removing Date (Delete Event)
                    if (oldTodo.dueDate && newTodo.dueDate === undefined) {
                        if (oldTodo.linkedEventId) {
                            deleteCalendarEvent(oldTodo.linkedEventId).finally(() => {
                                patchTodoSync(set, get, instanceId, todoId, {
                                    linkedEventId: undefined,
                                    isSynced: false,
                                    syncStatus: "idle",
                                });
                            });
                        } else {
                            patchTodoSync(set, get, instanceId, todoId, { syncStatus: "idle" });
                        }
                        return; // No further action needed
                    }

                    // Case B: Adding Date (Create Event)
                    if (!oldTodo.dueDate && newTodo.dueDate) {
                        createCalendarEventFromTask(newTodo).then((res) => {
                            if (res.success && res.eventId) {
                                patchTodoSync(set, get, instanceId, todoId, {
                                    linkedEventId: res.eventId,
                                    isSynced: true,
                                    syncStatus: "success",
                                    lastSyncedAt: Date.now()
                                });
                            } else {
                                patchTodoSync(set, get, instanceId, todoId, { syncStatus: "error" });
                            }
                        });
                        return;
                    }

                    // Case C: Modifying existing tracked text/date
                    if (oldTodo.linkedEventId && (oldTodo.text !== newTodo.text || oldTodo.dueDate !== newTodo.dueDate)) {
                        // Debounce the update
                        if (updateQueue.has(todoId)) {
                            clearTimeout(updateQueue.get(todoId)!);
                        }

                        const timeoutId = setTimeout(() => {
                            updateQueue.delete(todoId);
                            // Important: Ensure we get freshest state
                            const currentInst = get().instances[instanceId];
                            const currentTodo = currentInst?.data?.todos?.find(t => t.id === todoId);
                            if (!currentTodo || !currentTodo.linkedEventId) return;

                            updateCalendarEventFromTask(currentTodo).then((res) => {
                                if (res.success) {
                                    patchTodoSync(set, get, instanceId, todoId, {
                                        syncStatus: "success",
                                        lastSyncedAt: Date.now()
                                    });
                                } else {
                                    patchTodoSync(set, get, instanceId, todoId, { syncStatus: "error" });
                                }
                            });
                        }, 600);

                        updateQueue.set(todoId, timeoutId);
                    }
                },

                reorderTodos: (instanceId, newOrder) =>
                    set((s) => {
                        const inst = s.instances[instanceId];
                        if (!inst) return s;
                        return {
                            ...pushSnapshot(s),
                            instances: {
                                ...s.instances,
                                [instanceId]: {
                                    ...inst,
                                    data: { ...inst.data, todos: newOrder },
                                    updatedAt: Date.now(),
                                },
                            },
                        };
                    }),

                setTodoSortMode: (instanceId, sortMode) =>
                    set((s) => {
                        const inst = s.instances[instanceId];
                        if (!inst) return s;
                        return {
                            ...pushSnapshot(s),
                            instances: {
                                ...s.instances,
                                [instanceId]: {
                                    ...inst,
                                    data: { ...inst.data, sortMode },
                                    updatedAt: Date.now(),
                                },
                            },
                        };
                    }),

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
            };
        },
        {
            name: typeof window !== "undefined" && window.location.pathname.startsWith("/demo") ? "tbb-demo-widgets" : "tbb-widgets",
            version: 4,
            // Exclude history from persistence — it's runtime-only
            partialize: (state) => ({
                instances: state.instances,
                layout: state.layout,
                lockedGroups: state.lockedGroups,
                canvases: state.canvases,
                layouts: state.layouts,
                activeCanvasId: state.activeCanvasId,
                healthHistory: state.healthHistory,
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

                // Final step: strip any widget types no longer in the registry
                // (e.g. Habit Tracker removed, old custom types). This runs on
                // every rehydration so stale localStorage data can never cause
                // index mismatches in the mobile carousel.
                const { instances: cleanInstances, layout: cleanLayout } =
                    sanitizeWidgets({ ...instances }, [...(state as any).layout ?? []]);

                // v6: Setup Completion
                let hasCompletedSetup = (state as any).hasCompletedSetup;
                if (hasCompletedSetup === undefined) {
                    // If they have any widgets from before or this is an existing user migrating
                    hasCompletedSetup = cleanLayout.length > 0;
                }

                // Initial Canvas setup for legacy instances
                let canvases = state.canvases;
                let layouts = state.layouts as any;
                let activeCanvasId = state.activeCanvasId;

                const hasNewLayoutFormat = layouts && typeof layouts === 'object' && Object.values(layouts).some(l => l && typeof l === 'object' && 'positions' in l);

                if (!canvases || !Array.isArray(canvases) || canvases.length === 0 || !hasNewLayoutFormat) {
                    // Initialize or Upgrade layouts
                    const upgradedLayouts: Record<string, any> = {};
                    const currentCanvases = (canvases && Array.isArray(canvases) && canvases.length > 0)
                        ? canvases
                        : [{ id: "main", name: "Main Canvas" }];

                    currentCanvases.forEach(c => {
                        let order: string[] = [];
                        if (layouts && layouts[c.id]) {
                            const val = layouts[c.id];
                            order = Array.isArray(val) ? val : (val.order || []);
                        } else if (c.id === "main") {
                            order = cleanLayout;
                        }

                        const positions: Record<string, any> = {};
                        order.forEach(instId => {
                            if (cleanInstances[instId]?.layout) {
                                positions[instId] = { ...cleanInstances[instId].layout };
                            }
                        });
                        upgradedLayouts[c.id] = { order, positions };
                    });

                    canvases = currentCanvases;
                    layouts = upgradedLayouts;
                    activeCanvasId = activeCanvasId || "main";
                }

                return {
                    ...state,
                    instances: cleanInstances,
                    layout: cleanLayout,
                    hasCompletedSetup,
                    canvases,
                    layouts,
                    activeCanvasId
                };
            },
        }
    )
);
