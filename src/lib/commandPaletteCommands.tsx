import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
    LayoutDashboard,
    Calendar,
    CheckSquare,
    Settings,
    Plus,
    Minimize2,
    Maximize2,
    RotateCcw,
    LayoutGrid,
    Target,
    Save
} from "lucide-react";
import { WIDGET_REGISTRY } from "./widgetRegistry";

export type CommandSection = "Recent" | "Navigation" | "Widgets" | "Dashboard";

export type Command = {
    id: string;
    title: string;
    subtitle?: string;
    section: CommandSection;
    subGroup?: string;
    keywords?: string[];
    icon?: React.ReactNode;
    run: () => void;
    score?: (ctx: Context) => number;
};

import type { TabId } from "@/types/widget";
import { useTemplateStore } from "@/store/useTemplateStore";
import { DEFAULT_TEMPLATES } from "@/lib/defaultTemplates";
import type { CommandHistory } from "@/components/CommandPalette";

type Context = {
    router: AppRouterInstance;
    widgetStore: any;
    settingsStore: any;
    setActiveTab: (tab: TabId) => void;
    currentTab: TabId;
    recent: CommandHistory[];
};

export function getCommands(ctx: Context): Command[] {
    const { widgetStore, settingsStore, setActiveTab, currentTab, recent } = ctx;
    const commands: Command[] = [];

    // ─── Navigation ───
    commands.push(
        {
            id: "nav-dashboard",
            title: "Go to Dashboard",
            section: "Navigation",
            icon: <LayoutDashboard size={16} />,
            run: () => setActiveTab("dashboard"),
            score: (c) => c.currentTab !== "dashboard" ? 10 : -10 // prioritize if not currently on it
        },
        {
            id: "nav-calendar",
            title: "Go to Calendar",
            section: "Navigation",
            icon: <Calendar size={16} />,
            run: () => setActiveTab("calendar"),
            score: (c) => c.currentTab !== "calendar" ? 10 : -10
        },
        {
            id: "nav-projects",
            title: "Go to Projects",
            section: "Navigation",
            icon: <CheckSquare size={16} />,
            run: () => setActiveTab("projects"),
            score: (c) => c.currentTab !== "projects" ? 10 : -10
        },
        {
            id: "nav-focus",
            title: "Go to Focus",
            section: "Navigation",
            icon: <Target size={16} />,
            run: () => setActiveTab("focus"),
            score: (c) => c.currentTab !== "focus" ? 10 : -10
        },
        {
            id: "nav-settings",
            title: "Go to Settings",
            section: "Navigation",
            icon: <Settings size={16} />,
            run: () => setActiveTab("settings"),
            score: (c) => c.currentTab !== "settings" ? 10 : -10
        }
    );

    // ─── Dashboard Actions ───
    commands.push(
        {
            id: "action-toggle-edit",
            title: "Toggle Edit Mode",
            subtitle: settingsStore.dashboardEditMode ? "Turn Off" : "Turn On",
            section: "Dashboard",
            subGroup: "Canvas",
            icon: <LayoutDashboard size={16} />,
            run: () => settingsStore.toggleDashboardEditMode(),
            score: (c) => c.currentTab === "dashboard" ? 20 : 0
        },
        {
            id: "action-auto-arrange",
            title: "Auto Arrange Widgets",
            section: "Dashboard",
            subGroup: "Canvas",
            icon: <LayoutGrid size={16} />,
            run: () => widgetStore.autoArrangeInstances(),
            score: (c) => c.currentTab === "dashboard" ? 20 : 0
        },
        {
            id: "action-reset-layout",
            title: "Reset Layout",
            section: "Dashboard",
            subGroup: "Canvas",
            icon: <RotateCcw size={16} />,
            run: () => {
                if (confirm("Reset layout to default? This cannot be undone.")) {
                    widgetStore.resetToDefaults();
                }
            },
            score: (c) => c.currentTab === "dashboard" ? 20 : 0
        },
        {
            id: "action-collapse-all",
            title: "Collapse All Widgets",
            section: "Dashboard",
            subGroup: "Canvas",
            icon: <Minimize2 size={16} />,
            run: () => widgetStore.collapseAll(),
            score: (c) => c.currentTab === "dashboard" ? 15 : 0
        },
        {
            id: "action-expand-all",
            title: "Expand All Widgets",
            section: "Dashboard",
            subGroup: "Canvas",
            icon: <Maximize2 size={16} />,
            run: () => widgetStore.expandAll(),
            score: (c) => c.currentTab === "dashboard" ? 15 : 0
        }
    );

    // ─── Templates ───
    const tStore = useTemplateStore.getState();
    const allTemplates = [...DEFAULT_TEMPLATES, ...tStore.templates];

    allTemplates.forEach(t => {
        commands.push({
            id: `apply-template-${t.id}`,
            title: `Apply Template: ${t.name}`,
            section: "Dashboard", // Group under Dashboard
            subGroup: "Templates",
            icon: <LayoutGrid size={16} />,
            run: () => {
                if (confirm(`Replace current dashboard with "${t.name}"?`)) {
                    tStore.applyTemplate(t.id);
                    setActiveTab("dashboard");
                }
            },
            score: (c) => c.currentTab === "dashboard" ? 10 : 0
        });
    });

    commands.push({
        id: "action-save-template",
        title: "Save Current as Template",
        section: "Dashboard",
        subGroup: "Templates",
        icon: <Save size={16} />,
        run: () => {
            const name = prompt("Enter template name:");
            if (name) {
                tStore.createFromCurrent(name);
                alert("Template saved!");
            }
        },
        score: (c) => c.currentTab === "dashboard" ? 15 : 0
    });

    // ─── Widgets ───
    WIDGET_REGISTRY.forEach((def) => {
        commands.push({
            id: `add-widget-${def.type}`,
            title: `Add ${def.defaultTitle}`,
            section: "Widgets",
            icon: <Plus size={16} />,
            keywords: ["add", "new", "create", def.type, def.defaultTitle],
            run: () => {
                widgetStore.addInstance(def.type);
                setActiveTab("dashboard"); // Ensure we go to dashboard to see it
            },
            score: (c) => c.currentTab === "dashboard" ? 12 : 5
        });
    });

    // ─── Sort and inject Recents ───
    commands.sort((a, b) => (b.score?.(ctx) ?? 0) - (a.score?.(ctx) ?? 0));

    [...recent].reverse().forEach((r) => {
        const original = commands.find(c => c.id === r.id);
        if (original) {
            commands.unshift({
                ...original,
                id: `recent-${original.id}`, // Unique ID for loop keys
                title: original.title,
                subtitle: original.subtitle,
                icon: original.icon,
                section: "Recent",
                subGroup: undefined,
                run: () => {
                    original.run();
                },
                score: () => 100 // Highest priority technically
            });
        }
    });

    return commands;
}
