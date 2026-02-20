/**
 * Aggregation & grouping utilities for insights data.
 */

import type { TimeRange, InsightCard } from "@/types/insights";
import type { TaskStats } from "@/types/insights";
import type { Project } from "@/types/widget";

/** Get an array of ISO date strings for the given range ending today */
export function getDaysInRange(range: TimeRange): string[] {
    const days: string[] = [];
    const today = new Date();
    const count = range === "day" ? 1 : range === "week" ? 7 : 30;

    for (let i = count - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
    }
    return days;
}

/** Compute completion rate (safe division) */
export function computeCompletionRate(stats: TaskStats): number {
    return stats.total === 0 ? 0 : stats.completed / stats.total;
}

/** Auto-generate human-readable insight cards */
export function generateInsights(
    focusByDay: Record<string, number>,
    taskStats: TaskStats,
    projects: Project[]
): InsightCard[] {
    const cards: InsightCard[] = [];

    // Best day of week
    const dayTotals: Record<string, number> = {};
    Object.entries(focusByDay).forEach(([dateStr, minutes]) => {
        const dow = new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
            weekday: "long",
        });
        dayTotals[dow] = (dayTotals[dow] || 0) + minutes;
    });

    const bestDow = Object.entries(dayTotals).reduce(
        (best, [day, val]) => (val > best[1] ? [day, val] : best),
        ["", 0] as [string, number]
    );
    if (bestDow[1] > 0) {
        cards.push({ text: `Your most productive day is ${bestDow[0]}`, type: "info" });
    }

    // Task completion
    if (taskStats.total > 0 && taskStats.completionRate > 0) {
        cards.push({
            text: `${Math.round(taskStats.completionRate * 100)}% task completion rate`,
            type: taskStats.completionRate >= 0.7 ? "success" : "info",
        });
    }

    if (taskStats.overdue > 0) {
        cards.push({
            text: `${taskStats.overdue} overdue task${taskStats.overdue > 1 ? "s" : ""} need attention`,
            type: "warning",
        });
    }

    // Inactive projects
    const today = new Date();
    projects.forEach((p) => {
        if (p.lastWorkedDate) {
            const lastWorked = new Date(p.lastWorkedDate + "T00:00:00");
            const daysSince = Math.floor(
                (today.getTime() - lastWorked.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (daysSince >= 5) {
                cards.push({
                    text: `${p.name} has been inactive for ${daysSince} days`,
                    type: "warning",
                });
            }
        }
    });

    if (cards.length === 0) {
        cards.push({ text: "Start tracking to unlock insights", type: "info" });
    }

    return cards;
}
