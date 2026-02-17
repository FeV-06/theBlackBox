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
    | "gmail";

/**
 * A single widget instance on the dashboard.
 * Multiple instances of the same type can coexist.
 */
export interface WidgetInstance {
    instanceId: string;
    type: WidgetType;
    title?: string;
    enabled: boolean;
    createdAt: number;
    updatedAt: number;
    config: Record<string, unknown>;
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
