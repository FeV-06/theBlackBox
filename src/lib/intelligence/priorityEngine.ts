import type { WidgetInstance } from "@/types/widgetInstance";
import type { DashboardContextValue } from "@/hooks/useDashboardContext";

export type PriorityResult = {
    score: number; // 0-100
    glowColor?: string;
    label?: "urgent" | "active" | "normal";
};

export function computeWidgetPriority(
    instance: WidgetInstance,
    context: DashboardContextValue
): PriorityResult {
    let score = 30; // Base score
    let glowColor: string | undefined;

    // Default glow colors by type
    if (instance.type === "todo") glowColor = "rgba(249, 115, 22, 1)"; // Orange
    if (instance.type === "focus_summary") glowColor = "rgba(168, 85, 247, 1)"; // Purple
    if (instance.type === "projects_overview" || instance.type === "kanban") glowColor = "rgba(59, 130, 246, 1)"; // Blue
    if (instance.type === "insights") glowColor = "rgba(6, 182, 212, 1)"; // Cyan

    const {
        hour,
        overdueTodos,
        todayTodos,
        highPriorityTodos,
        isFocusActive,
        stalledProjects
    } = context;

    const isMorning = hour >= 6 && hour < 12;
    const isEvening = hour >= 18 && hour < 24; // Implicit 24 max

    // ─── Time OF DAY BOOST ───
    if (isMorning) {
        if (instance.type === "todo") score += 20;
        if (instance.type === "focus_summary") score += 15;
    }
    if (isEvening) {
        if (instance.type === "focus_summary") score += 20;
        if (instance.type === "projects_overview" || instance.type === "kanban") score += 15;
        if (instance.type === "insights") score += 10;
        // Habit tracker is implicit 'habits' id or 'habit_tracker' type
        if (instance.type === "habit_tracker") score += 15;
    }

    // ─── URGENCY - TODOS ───
    if (instance.type === "todo") {
        if (overdueTodos > 0) score += 40;
        if (todayTodos > 0) score += 20;
        if (highPriorityTodos > 0) score += 20;
    }

    // ─── FOCUS ACTIVITY ───
    if (instance.type === "focus_summary") {
        if (isFocusActive) score = 100; // Hard override
    }

    // ─── PROJECTS ───
    if (instance.type === "projects_overview" || instance.type === "kanban") {
        if (stalledProjects > 0) score += 25;
    }

    // ─── BEHAVIORAL PATTERN BOOSTS ───
    const focusPattern = context.patterns?.find(p => p.type === "focus_hour");
    const burstPattern = context.patterns?.find(p => p.type === "productivity_burst");
    const recoveryPattern = context.patterns?.find(p => p.type === "low_activity");

    if (instance.type === "focus_summary") {
        if (focusPattern && focusPattern.confidence >= 0.7) score += 15;
        if (recoveryPattern && recoveryPattern.confidence >= 0.7) score += 8;
    }
    if (instance.type === "todo") {
        if (burstPattern && burstPattern.confidence >= 0.7) score += 15;
    }

    // Clamp score
    score = Math.min(100, score);

    let label: PriorityResult["label"] = "normal";
    if (score > 85) label = "urgent";
    else if (score > 65) label = "active";

    return { score, glowColor, label };
}
