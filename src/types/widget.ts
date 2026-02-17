import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

export type WidgetId =
    | "quote_clock"
    | "todo"
    | "habits"
    | "github"
    | "weather"
    | "links"
    | "focus_summary"
    | "projects_overview"
    | "custom_api"
    | "gmail";

export interface WidgetDefinition {
    id: WidgetId;
    title: string;
    icon: LucideIcon;
    component: ComponentType;
    defaultEnabled: boolean;
}

export type TabId = "dashboard" | "projects" | "focus" | "calendar" | "settings";

export interface Todo {
    id: string;
    text: string;
    done: boolean;
    createdAt: number;
}

export interface Habit {
    id: string;
    name: string;
    checkedDates: string[]; // ISO date strings
    createdAt: number;
}

export interface FocusSession {
    id: string;
    startTime: number;
    endTime: number;
    duration: number; // seconds
    type: "normal" | "pomodoro";
}

export interface SubTask {
    id: string;
    text: string;
    done: boolean;
}

export interface ProjectTask {
    id: string;
    text: string;
    done: boolean;
    subtasks: SubTask[];
}

export interface Project {
    id: string;
    name: string;
    description: string;
    color: string;
    tasks: ProjectTask[];
    createdAt: number;
    streakDays: number;
    lastWorkedDate: string | null;
}

export interface Bookmark {
    id: string;
    title: string;
    url: string;
    icon?: string;
}

export type QuoteVibe = "motivational" | "anime" | "tech" | "random";

export interface ApiWidgetInstance {
    id: string;
    name: string;
    template: string;
    url: string;
    headers: Record<string, string>;
    refreshInterval: number; // seconds, 0 = manual
}

export interface CalendarEvent {
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    color: string;
}
