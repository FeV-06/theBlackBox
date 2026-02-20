import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

/** All possible widget types in the system */
export type WidgetType =
    | "quote_clock"
    | "todo"
    | "habit_tracker"
    | "github"
    | "weather"
    | "quick_links"
    | "focus_summary"
    | "projects_overview"
    | "custom_api"
    | "gmail"
    | "section_divider"
    | "kanban"
    | "insights";

export interface WidgetLayout {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface WidgetInstance {
    instanceId: string;
    type: WidgetType;
    title?: string;
    enabled: boolean;
    createdAt: number;
    updatedAt: number;
    config: Record<string, unknown>;
    layout: WidgetLayout;
    isLocked?: boolean;
    groupDisabled?: boolean;
    zIndex?: number;

    // V1.1 Collapse Support
    isCollapsed?: boolean;
    collapsedHeight?: number;
    savedExpandedHeight?: number;

    // Per-instance widget data
    data?: {
        todos?: TodoItem[];
        sortMode?: "manual" | "priority" | "dueDate";
        [key: string]: any;
    };
}

export interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
    priority: "low" | "medium" | "high";
    dueDate?: string; // LOCAL ISO STRING (NOT UTC SHIFTED)
    createdAt: number;
    linkedEventId?: string; // future calendar sync
    isSynced?: boolean;
    syncStatus?: "idle" | "pending" | "success" | "error";
    lastSyncedAt?: number;
}

/**
 * Static definition/registry entry for a widget type.
 * Used to lookup component, icon, default title, etc.
 */
export interface WidgetTypeDefinition {
    type: WidgetType;
    defaultTitle: string;
    icon: LucideIcon;
    component: ComponentType<{ instance: WidgetInstance }>;
    allowMultiple: boolean;
    defaultConfig: Record<string, unknown>;
}
