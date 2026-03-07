import type { ComponentType, LazyExoticComponent, ReactNode } from "react";

// ─── Config Schema ─────────────────────────────────────────────────────────

/** Primitive field types for schema-driven form generation */
export type SchemaFieldType = "string" | "number" | "boolean" | "select" | "textarea" | "url" | "color";

export interface SchemaField {
    type: SchemaFieldType;
    label?: string;
    placeholder?: string;
    /** For 'select' type */
    options?: { label: string; value: string }[];
    required?: boolean;
    category?: string;
}

/** Maps config keys to their field descriptors */
export type WidgetConfigSchema = Record<string, SchemaFieldType | SchemaField>;

// ─── Universal Widget Definition ──────────────────────────────────────────

/**
 * The single source of truth for a widget instance.
 * Stored in Supabase `widgets` table and hydrated into Zustand.
 */
export interface UniversalWidgetDefinition {
    /** Unique instance ID (UUID v7) */
    id: string;
    /** Widget template type, maps to a WidgetManifest */
    type: string;
    /** Schema version — bumped when configSchema evolves */
    version: number;
    /** Widget-specific settings (≤ 16KB) */
    config: Record<string, unknown>;
    /** UI metadata: position, title, enabled, etc. */
    meta: WidgetMeta;
}

export interface WidgetMeta {
    title?: string;
    enabled: boolean;
    isLocked?: boolean;
    isCollapsed?: boolean;
    zIndex?: number;
    /** Spatial position on the canvas */
    layout: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
}

// ─── Manifest ─────────────────────────────────────────────────────────────

/**
 * Every widget template must export a WidgetManifest as
 * `src/widgets/<name>/widget.manifest.ts → widgetManifest`.
 */
export interface WidgetManifest {
    /** Unique template ID (e.g. "api-widget", "github-stats") */
    id: string;
    name: string;
    description?: string;
    icon?: string;
    category?: "developer" | "productivity" | "data" | "utility" | "content";
    /** React.lazy-compatible dynamic import */
    component: () => Promise<{ default: ComponentType<WidgetComponentProps> }>;
    /** Optional settings panel */
    settings?: () => Promise<{ default: ComponentType<WidgetSettingsProps> }>;
    /** Optional loading skeleton override */
    skeleton?: ReactNode;
    /** Schema for schema-driven builder form */
    configSchema?: WidgetConfigSchema;
    /** Defaults merged with user config on creation */
    defaultConfig?: Record<string, unknown>;
    /** Config migration functions keyed by target version */
    migrations?: Record<number, (config: Record<string, unknown>) => Record<string, unknown>>;
    /** Whether the user can add multiple instances of this widget */
    allowMultiple?: boolean;
}

// ─── Widget Isolation Contract (SAFETY RULE — MANDATORY) ──────────────────
//
// Widgets MUST access their configuration exclusively via:
//   useWidgetConfig(widgetId)
//
// Widgets MUST NOT:
//   ❌ import useWidgetStore directly
//   ❌ import any other global Zustand store
//   ❌ call store actions outside of the provided hooks
//
// Rationale:
//   - Prevents cross-widget state mutation
//   - Stops cascading re-renders across the dashboard
//   - Enables safe third-party widget ecosystems
//   - Ensures the 16KB config size constraint is always enforced
//
// Provided hooks:
//   useWidgetConfig(widgetId) → { config, updateConfig }
//
// ─────────────────────────────────────────────────────────────────────────────

// ─── Component Props ──────────────────────────────────────────────────────

export interface WidgetComponentProps {
    widgetId?: string;
    previewConfig?: Record<string, any>;
}

export interface WidgetSettingsProps {
    widgetId: string;
    onClose?: () => void;
}

// ─── Registry ─────────────────────────────────────────────────────────────

/** The central registry populated by loadWidgets() */
export type WidgetRegistry = Map<string, WidgetManifest>;

// ─── Sync ─────────────────────────────────────────────────────────────────

/** Tracks whether a state update originated locally or from a remote event */
export type UpdateSource = "local" | "remote";
