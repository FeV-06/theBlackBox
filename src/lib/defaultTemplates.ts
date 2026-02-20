import { WidgetInstance } from "@/types/widgetInstance";
import { TabId } from "@/types/widget";

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
    snapshot: DashboardSnapshot;
}

const now = Date.now();

// Helper to create basic instances for templates
function createInst(type: string, id: string, x: number, y: number, w: number, h: number): WidgetInstance {
    return {
        instanceId: id,
        type: type as any,
        enabled: true,
        createdAt: now,
        updatedAt: now,
        config: {},
        layout: { x, y, w, h },
    };
}

// 1. Minimal Dashboard
const minimalInstances = {
    "clock_min": createInst("quote_clock", "clock_min", 20, 20, 360, 260),
    "todo_min": createInst("todo", "todo_min", 400, 20, 360, 400),
    "links_min": createInst("quick_links", "links_min", 20, 300, 360, 200),
};

const minimalTemplate: TemplatePreset = {
    id: "template_minimal",
    name: "Minimalist Focus",
    createdAt: now,
    updatedAt: now,
    isDefault: true,
    snapshot: {
        instances: minimalInstances,
        layout: ["clock_min", "todo_min", "links_min"],
        lockedGroups: {},
    }
};

// 2. Developer Setup (GitHub + Projects)
const devInstances = {
    "github_dev": createInst("github", "github_dev", 20, 20, 360, 300),
    "projects_dev": createInst("projects_overview", "projects_dev", 400, 20, 740, 300),
    "todo_dev": createInst("todo", "todo_dev", 20, 340, 360, 400),
    "clock_dev": createInst("quote_clock", "clock_dev", 400, 340, 360, 260),
};

const devTemplate: TemplatePreset = {
    id: "template_dev",
    name: "Developer Station",
    createdAt: now,
    updatedAt: now,
    isDefault: true,
    snapshot: {
        instances: devInstances,
        layout: ["github_dev", "projects_dev", "todo_dev", "clock_dev"],
        lockedGroups: {},
    }
};

// 3. Inbox Zero (Gmail Focused)
const inboxInstances = {
    "gmail_main": createInst("gmail", "gmail_main", 20, 20, 740, 500),
    "todo_side": createInst("todo", "todo_side", 780, 20, 360, 500),
    "calendar_widget": createInst("quote_clock", "calendar_widget", 20, 540, 360, 260),
};

const inboxTemplate: TemplatePreset = {
    id: "template_inbox",
    name: "Inbox Zero",
    createdAt: now,
    updatedAt: now,
    isDefault: true,
    snapshot: {
        instances: inboxInstances,
        layout: ["gmail_main", "todo_side", "calendar_widget"],
        lockedGroups: {},
    }
};

export const DEFAULT_TEMPLATES: TemplatePreset[] = [
    minimalTemplate,
    devTemplate,
    inboxTemplate
];
