"use client";

import type { WidgetInstance } from "@/types/widgetInstance";

/**
 * WidgetRow — the shape that lives in the Supabase `widgets` table.
 * Flat, serializable, with all Supabase-required columns.
 */
export interface WidgetRow {
    id: string;              // = instanceId
    user_id?: string;        // populated by RLS on the server — client omits it
    device_id: string;
    type: string;
    title: string | null;
    enabled: boolean;
    is_locked: boolean;
    is_collapsed: boolean;
    z_index: number;
    layout_x: number;
    layout_y: number;
    layout_w: number;
    layout_h: number;
    config: Record<string, unknown>;
    data: Record<string, unknown>;   // todos, kanban cards, etc. as JSONB
    created_at: string;              // ISO string
    updated_at: string;              // ISO string — used for LWW conflict resolution
    deleted_at: string | null;
}

/** Convert a local WidgetInstance → Supabase row (for push). */
export function instanceToRow(inst: WidgetInstance, userId: string, deviceId = "web"): WidgetRow {
    return {
        id: inst.instanceId,
        user_id: userId,
        device_id: deviceId,
        type: inst.type,
        title: inst.title ?? null,
        enabled: inst.enabled,
        is_locked: inst.isLocked ?? false,
        is_collapsed: inst.isCollapsed ?? false,
        z_index: inst.zIndex ?? 1,
        layout_x: inst.layout.x,
        layout_y: inst.layout.y,
        layout_w: inst.layout.w,
        layout_h: inst.layout.h,
        config: inst.config ?? {},
        data: (inst.data ?? {}) as Record<string, unknown>,
        created_at: new Date(inst.createdAt).toISOString(),
        updated_at: new Date(inst.updatedAt).toISOString(),
        deleted_at: null,
    };
}

/** Convert a Supabase row → local WidgetInstance (for pull / remote change). */
export function rowToInstance(row: WidgetRow): WidgetInstance {
    return {
        instanceId: row.id,
        type: row.type as WidgetInstance["type"],
        title: row.title ?? undefined,
        enabled: row.enabled,
        isLocked: row.is_locked,
        isCollapsed: row.is_collapsed,
        zIndex: row.z_index,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.updated_at).getTime(),
        config: row.config ?? {},
        data: row.data ?? {},
        layout: {
            x: row.layout_x,
            y: row.layout_y,
            w: row.layout_w,
            h: row.layout_h,
        },
    };
}
