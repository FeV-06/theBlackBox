"use client";

import type { WidgetTypeDefinition } from "@/types/widgetInstance";
import QuoteClockWidget from "@/components/widgets/QuoteClockWidget";
import TodoWidget from "@/components/widgets/TodoWidget";
import HabitTrackerWidget from "@/components/widgets/HabitTrackerWidget";
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
    Flame,
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
    { type: "quote_clock", defaultTitle: "Quote & Clock", icon: Clock, component: QuoteClockWidget, allowMultiple: false, defaultConfig: {} },
    { type: "todo", defaultTitle: "To-Do List", icon: CheckSquare, component: TodoWidget, allowMultiple: false, defaultConfig: {} },
    { type: "habit_tracker", defaultTitle: "Habit Tracker", icon: Flame, component: HabitTrackerWidget, allowMultiple: false, defaultConfig: {} },
    { type: "github", defaultTitle: "GitHub", icon: Github, component: GitHubWidget, allowMultiple: false, defaultConfig: {} },
    { type: "weather", defaultTitle: "Weather", icon: CloudSun, component: WeatherWidget, allowMultiple: true, defaultConfig: {} },
    { type: "quick_links", defaultTitle: "Quick Links", icon: Link2, component: QuickLinksWidget, allowMultiple: false, defaultConfig: {} },
    { type: "focus_summary", defaultTitle: "Focus Summary", icon: Timer, component: FocusSummaryWidget, allowMultiple: false, defaultConfig: {} },
    { type: "projects_overview", defaultTitle: "Projects", icon: FolderKanban, component: ProjectsOverviewWidget, allowMultiple: false, defaultConfig: {} },
    { type: "custom_api", defaultTitle: "Custom API", icon: Puzzle, component: CustomApiWidget, allowMultiple: true, defaultConfig: {} },
    { type: "gmail", defaultTitle: "Gmail", icon: Mail, component: GmailWidget, allowMultiple: true, defaultConfig: { mode: "basic", mailbox: "inbox", status: "all", category: "all", query: "" } },
    { type: "section_divider", defaultTitle: "Section Divider", icon: AlignLeft, component: SectionDividerWidget, allowMultiple: true, defaultConfig: { label: "New Section", style: "line" } },
    { type: "kanban", defaultTitle: "Kanban Board", icon: LayoutGrid, component: KanbanWidget, allowMultiple: true, defaultConfig: {} },
    { type: "insights", defaultTitle: "Insights", icon: BarChart3, component: InsightsWidget, allowMultiple: false, defaultConfig: {} },
];

export const registryMap = new Map(WIDGET_REGISTRY.map((d) => [d.type, d]));
