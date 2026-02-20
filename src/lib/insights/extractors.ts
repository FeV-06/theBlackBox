/**
 * Pure data extraction functions — NO UI, NO Zustand.
 * Transform raw store data into insights-ready formats.
 */

import type { FocusSession, Project } from "@/types/widget";
import type { TodoItem } from "@/types/widgetInstance";
import type { FocusPoint, TaskStats, ProjectStat, ProjectStats, CombinedPoint } from "@/types/insights";

/** Convert raw focus sessions into per-day minute totals */
export function extractFocusPoints(sessions: FocusSession[], days: string[]): FocusPoint[] {
    const map: Record<string, number> = {};
    days.forEach((d) => (map[d] = 0));

    sessions.forEach((s) => {
        const day = new Date(s.startTime).toISOString().slice(0, 10);
        if (map[day] !== undefined) {
            map[day] += s.duration; // seconds
        }
    });

    return days.map((d) => ({
        date: d,
        minutes: Math.round(map[d] / 60),
    }));
}

/** Flatten all todo widget instances into a single TaskStats */
export function extractTaskStats(todos: TodoItem[]): TaskStats {
    const completed = todos.filter((t) => t.completed).length;
    const pending = todos.filter((t) => !t.completed).length;
    const today = new Date().toISOString().slice(0, 10);
    const overdue = todos.filter(
        (t) => !t.completed && t.dueDate && t.dueDate < today
    ).length;

    const byPriority = { high: 0, medium: 0, low: 0 };
    todos.forEach((t) => {
        if (t.priority && byPriority[t.priority] !== undefined) {
            byPriority[t.priority]++;
        }
    });

    return {
        total: todos.length,
        completed,
        pending,
        overdue,
        byPriority,
        completionRate: todos.length > 0 ? completed / todos.length : 0,
    };
}

/** Compute per-project progress stats */
export function extractProjectStats(projects: Project[]): ProjectStats {
    const stats: ProjectStat[] = projects.map((p) => {
        const totalItems =
            p.tasks.length +
            p.tasks.reduce((s, t) => s + (t.subtasks?.length || 0), 0);
        const completedItems =
            p.tasks.filter((t) => t.status === "done").length +
            p.tasks.reduce(
                (s, t) => s + (t.subtasks?.filter((st) => st.completed).length || 0),
                0
            );
        const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

        return {
            id: p.id,
            name: p.name,
            color: p.color,
            totalItems,
            completedItems,
            progress,
            isComplete: totalItems > 0 && completedItems === totalItems,
        };
    });

    const active = stats.filter((s) => !s.isComplete).length;
    const completed = stats.filter((s) => s.isComplete).length;
    const avgProgress =
        stats.length > 0
            ? stats.reduce((a, s) => a + s.progress, 0) / stats.length
            : 0;

    return { stats, total: stats.length, active, completed, avgProgress };
}

/** Build combined focus-vs-tasks dataset for correlation chart */
export function extractCombinedData(
    focusPoints: FocusPoint[],
    todos: TodoItem[],
    days: string[]
): CombinedPoint[] {
    return days.map((day) => {
        const focus = focusPoints.find((fp) => fp.date === day);
        const tasksOnDay = todos.filter((t) => {
            if (!t.completed) return false;
            // Use createdAt as a proxy for completion date (closest available field)
            const created = new Date(t.createdAt).toISOString().slice(0, 10);
            return created === day;
        }).length;

        return {
            date: day,
            focusMinutes: focus?.minutes || 0,
            tasksCompleted: tasksOnDay,
        };
    });
}
