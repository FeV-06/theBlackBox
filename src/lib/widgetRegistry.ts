"use client";

import type { WidgetTypeDefinition } from "@/types/widgetInstance";
import QuoteClockWidget from "@/components/widgets/QuoteClockWidget";
import TodoWidget from "@/components/widgets/TodoWidget";
import GitHubWidget from "@/components/widgets/GitHubWidget";
import WeatherWidget from "@/components/widgets/WeatherWidget";
import QuickLinksWidget from "@/components/widgets/QuickLinksWidget";
import FocusSummaryWidget from "@/components/widgets/FocusSummaryWidget";
import ProjectsOverviewWidget from "@/components/widgets/ProjectsOverviewWidget";
import CustomApiWidget from "@/components/widgets/CustomApiWidget";
import GmailWidget from "@/components/widgets/GmailWidget";
import SectionDividerWidget from "@/components/widgets/SectionDividerWidget";
import KanbanWidget from "@/components/widgets/KanbanWidget";
import InsightsWidget from "@/components/widgets/InsightsWidget";

import {
    Clock,
    CheckSquare,
    Github,
    CloudSun,
    Link2,
    Timer,
    FolderKanban,
    Puzzle,
    Mail,
    AlignLeft,
    LayoutGrid,
    BarChart3,
} from "lucide-react";

export const WIDGET_REGISTRY: WidgetTypeDefinition[] = [
    { type: "quote_clock", defaultTitle: "Quote & Clock", icon: Clock, component: QuoteClockWidget, allowMultiple: false, defaultConfig: {}, configSchema: {} },
    { type: "todo", defaultTitle: "To-Do List", icon: CheckSquare, component: TodoWidget, allowMultiple: false, defaultConfig: {}, configSchema: {} },
    {
        type: "github",
        defaultTitle: "GitHub",
        icon: Github,
        component: GitHubWidget,
        allowMultiple: false,
        defaultConfig: { username: "" },
        configSchema: {
            username: { type: "string", label: "GitHub Username", placeholder: "e.g. octocat", required: true }
        }
    },
    {
        type: "weather",
        defaultTitle: "Weather",
        icon: CloudSun,
        component: WeatherWidget,
        allowMultiple: true,
        defaultConfig: { unit: "celsius" },
        configSchema: {
            unit: {
                type: "select",
                label: "Temperature Unit",
                options: [
                    { label: "Celsius (°C)", value: "celsius" },
                    { label: "Fahrenheit (°F)", value: "fahrenheit" }
                ]
            }
        }
    },
    { type: "quick_links", defaultTitle: "Quick Links", icon: Link2, component: QuickLinksWidget, allowMultiple: false, defaultConfig: {}, configSchema: {} },
    { type: "focus_summary", defaultTitle: "Focus Summary", icon: Timer, component: FocusSummaryWidget, allowMultiple: false, defaultConfig: {}, configSchema: {} },
    { type: "projects_overview", defaultTitle: "Projects", icon: FolderKanban, component: ProjectsOverviewWidget, allowMultiple: false, defaultConfig: {}, configSchema: {} },
    {
        type: "custom_api",
        defaultTitle: "Custom API",
        icon: Puzzle,
        component: CustomApiWidget,
        allowMultiple: true,
        defaultConfig: { endpoint: "", method: "GET", refreshInterval: 60 },
        configSchema: {
            endpoint: { type: "url", label: "API Endpoint URL", required: true },
            method: {
                type: "select",
                label: "HTTP Method",
                options: [
                    { label: "GET", value: "GET" },
                    { label: "POST", value: "POST" }
                ]
            },
            refreshInterval: { type: "number", label: "Refresh Interval (seconds)", placeholder: "60" }
        }
    },
    {
        type: "gmail",
        defaultTitle: "Gmail",
        icon: Mail,
        component: GmailWidget,
        allowMultiple: true,
        defaultConfig: { mode: "basic", mailbox: "inbox", status: "all", category: "all", query: "" },
        configSchema: {
            mode: {
                type: "select",
                label: "Display Mode",
                options: [
                    { label: "Basic", value: "basic" },
                    { label: "Detailed", value: "detailed" }
                ]
            },
            mailbox: { type: "string", label: "Mailbox / Label", placeholder: "inbox" },
            status: {
                type: "select",
                label: "Thread Status",
                options: [
                    { label: "All", value: "all" },
                    { label: "Unread", value: "unread" }
                ]
            }
        }
    },
    {
        type: "section_divider",
        defaultTitle: "Section Divider",
        icon: AlignLeft,
        component: SectionDividerWidget,
        allowMultiple: true,
        defaultConfig: { label: "New Section", style: "line" },
        configSchema: {
            label: { type: "string", label: "Divider Label", placeholder: "e.g. Work" },
            style: {
                type: "select",
                label: "Style",
                options: [
                    { label: "Solid Line", value: "line" },
                    { label: "Dashed", value: "dashed" },
                    { label: "Text Only", value: "text" }
                ]
            }
        }
    },
    { type: "kanban", defaultTitle: "Kanban Board", icon: LayoutGrid, component: KanbanWidget, allowMultiple: true, defaultConfig: {}, configSchema: {} },
    { type: "insights", defaultTitle: "Insights", icon: BarChart3, component: InsightsWidget, allowMultiple: false, defaultConfig: {}, configSchema: {} },
];

export const registryMap = new Map(WIDGET_REGISTRY.map((d) => [d.type, d]));
