import { TabId } from "@/types/widget";
import { WidgetInstance } from "@/types/widgetInstance";

export interface DashboardSnapshot {
    instances: Record<string, WidgetInstance>;
    layout: string[];
    lockedGroups: Record<string, boolean>;
    activeTab?: TabId;
}

export interface TemplatePreset {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    isDefault?: boolean;
    snapshot?: DashboardSnapshot;
    buildSnapshot?: () => DashboardSnapshot;
}

// No built-in default templates. Users create their own via Settings → Templates.
export const DEFAULT_TEMPLATES: TemplatePreset[] = [];
