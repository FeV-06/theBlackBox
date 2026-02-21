/**
 * Insight Engine v1
 *
 * Centralized analytics — generates intelligent, human-readable insights
 * from Focus sessions, Todos, and Projects. NO AI, NO external APIs.
 *
 * Architecture: pure function, no side-effects, no Zustand.
 */

import type { FocusSession, Project } from "@/types/widget";
import type { TodoItem } from "@/types/widgetInstance";
import type { DashboardContextValue } from "@/hooks/useDashboardContext";
import { generatePredictiveInsights } from "../intelligence/predictiveEngine";

/* ── Types ── */

export interface Insight {
    id: string;
    type: "positive" | "warning" | "info" | "predictive";
    title: string;
    description: string;
    priority: number; // higher = more important, used for sorting
    isPredictive?: boolean;
}

export interface InsightInput {
    focusSessions: FocusSession[];
    todos: TodoItem[];
    projects: Project[];
}

/* ── Constants ── */

const MAX_INSIGHTS = 7;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

/* ── Helpers ── */

function toDateStr(ts: number): string {
    return new Date(ts).toISOString().slice(0, 10);
}

function daysBetween(a: Date, b: Date): number {
    return Math.floor(Math.abs(a.getTime() - b.getTime()) / MS_PER_DAY);
}

/* ── Insight Generators ── */

/** 1. Peak focus hour — which hour of day has most focus time */
function peakFocusHour(sessions: FocusSession[]): Insight | null {
    if (sessions.length === 0) return null;

    const hourBuckets = new Array(24).fill(0);
    sessions.forEach((s) => {
        const hour = new Date(s.startTime).getHours();
        hourBuckets[hour] += s.duration;
    });

    const peakHour = hourBuckets.indexOf(Math.max(...hourBuckets));
    const totalMinutes = Math.round(hourBuckets[peakHour] / 60);

    if (totalMinutes === 0) return null;

    const label =
        peakHour === 0
            ? "12 AM"
            : peakHour < 12
                ? `${peakHour} AM`
                : peakHour === 12
                    ? "12 PM"
                    : `${peakHour - 12} PM`;

    return {
        id: "peak-focus-hour",
        type: "info",
        title: "Peak Focus Hour",
        description: `You focus best around ${label} — ${totalMinutes} total minutes logged at this hour`,
        priority: 6,
    };
}

/** 2. Weekly focus trend — % increase/decrease vs previous week */
function weeklyFocusTrend(sessions: FocusSession[]): Insight | null {
    if (sessions.length < 2) return null;

    const now = Date.now();
    const thisWeekStart = now - 7 * MS_PER_DAY;
    const lastWeekStart = now - 14 * MS_PER_DAY;

    const thisWeek = sessions
        .filter((s) => s.startTime >= thisWeekStart)
        .reduce((a, s) => a + s.duration, 0);

    const lastWeek = sessions
        .filter((s) => s.startTime >= lastWeekStart && s.startTime < thisWeekStart)
        .reduce((a, s) => a + s.duration, 0);

    if (lastWeek === 0 && thisWeek === 0) return null;

    if (lastWeek === 0) {
        return {
            id: "weekly-focus-trend",
            type: "positive",
            title: "Focus Kickoff",
            description: `${Math.round(thisWeek / 60)} minutes of focus this week — great start!`,
            priority: 5,
        };
    }

    const pctChange = ((thisWeek - lastWeek) / lastWeek) * 100;
    const absChange = Math.abs(Math.round(pctChange));

    if (pctChange >= 10) {
        return {
            id: "weekly-focus-trend",
            type: "positive",
            title: "Focus Up",
            description: `${absChange}% more focus time this week vs last — keep the momentum`,
            priority: 7,
        };
    } else if (pctChange <= -10) {
        return {
            id: "weekly-focus-trend",
            type: "warning",
            title: "Focus Dip",
            description: `${absChange}% less focus time this week — consider scheduling a focus block`,
            priority: 7,
        };
    }

    return {
        id: "weekly-focus-trend",
        type: "info",
        title: "Steady Focus",
        description: `Focus time is consistent week-over-week — within ${absChange}%`,
        priority: 3,
    };
}

/** 3. Todo completion rate & High Completion Signal */
function todoCompletion(todos: TodoItem[]): Insight[] {
    if (todos.length === 0) return [];

    const results: Insight[] = [];
    const completed = todos.filter((t) => t.completed).length;

    // High Completion Rule
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayTodos = todos.filter(t =>
        (t.completed && toDateStr(t.createdAt || 0) === todayStr) || // simplistic fallback
        (!t.completed && t.dueDate === todayStr)
    );

    const todayCompleted = todayTodos.filter(t => t.completed).length;
    if (todayTodos.length >= 5 && (todayCompleted / todayTodos.length) >= 0.8) {
        results.push({
            id: "high-completion",
            type: "positive",
            title: "Strong Execution",
            description: `You've completed ${Math.round((todayCompleted / todayTodos.length) * 100)}% of your tasks today. Great work!`,
            priority: 9,
        });
    }

    const rate = Math.round((completed / todos.length) * 100);
    const type = rate >= 70 ? "positive" : rate >= 40 ? "info" : "warning";

    results.push({
        id: "todo-completion",
        type,
        title: `${rate}% Completion Rate`,
        description: `${completed} of ${todos.length} tasks completed`,
        priority: rate >= 70 ? 5 : 6,
    });

    return results;
}

/** 4. Overdue tasks */
function overdueTasks(todos: TodoItem[]): Insight | null {
    const today = new Date().toISOString().slice(0, 10);
    const overdue = todos.filter((t) => !t.completed && t.dueDate && t.dueDate < today);

    if (overdue.length === 0) return null;

    return {
        id: "overdue-tasks",
        type: "warning",
        title: `${overdue.length} Overdue Task${overdue.length > 1 ? "s" : ""}`,
        description: `You have ${overdue.length} task${overdue.length > 1 ? "s" : ""} past due — review and reprioritize`,
        priority: 8,
    };
}

/** 5. Overall project progress */
function projectProgress(projects: Project[]): Insight | null {
    if (projects.length === 0) return null;

    let totalItems = 0;
    let doneItems = 0;

    projects.forEach((p) => {
        totalItems +=
            p.tasks.length +
            p.tasks.reduce((s, t) => s + (t.subtasks?.length || 0), 0);
        doneItems +=
            p.tasks.filter((t) => t.status === "done").length +
            p.tasks.reduce(
                (s, t) => s + (t.subtasks?.filter((st) => st.completed).length || 0),
                0
            );
    });

    if (totalItems === 0) return null;

    const pct = Math.round((doneItems / totalItems) * 100);

    return {
        id: "project-progress",
        type: pct >= 70 ? "positive" : "info",
        title: `${pct}% Project Progress`,
        description: `${doneItems} of ${totalItems} items completed across ${projects.length} project${projects.length > 1 ? "s" : ""}`,
        priority: 4,
    };
}

/** 6. Most active project */
function mostActiveProject(projects: Project[]): Insight | null {
    if (projects.length === 0) return null;

    const best = projects.reduce(
        (top, p) => {
            const done =
                p.tasks.filter((t) => t.status === "done").length +
                p.tasks.reduce(
                    (s, t) => s + (t.subtasks?.filter((st) => st.completed).length || 0),
                    0
                );
            return done > top.done ? { name: p.name, done } : top;
        },
        { name: "", done: 0 }
    );

    if (best.done === 0) return null;

    return {
        id: "most-active-project",
        type: "positive",
        title: "Most Active",
        description: `"${best.name}" leads with ${best.done} items done`,
        priority: 3,
    };
}

/** 7. Consecutive activity streak */
function activityStreak(
    sessions: FocusSession[],
    todos: TodoItem[],
    projects: Project[]
): Insight | null {
    // Collect all activity dates
    const dates = new Set<string>();

    sessions.forEach((s) => dates.add(toDateStr(s.startTime)));
    todos.forEach((t) => {
        if (t.completed) dates.add(toDateStr(t.createdAt));
    });
    projects.forEach((p) => {
        if (p.lastWorkedDate) dates.add(p.lastWorkedDate);
        p.tasks.forEach((t) => dates.add(toDateStr(t.createdAt)));
    });

    // Count consecutive days ending today (or yesterday)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    const check = new Date(today);

    // Allow starting from yesterday if no activity today yet
    if (!dates.has(toDateStr(check.getTime()))) {
        check.setDate(check.getDate() - 1);
    }

    while (dates.has(toDateStr(check.getTime()))) {
        streak++;
        check.setDate(check.getDate() - 1);
    }

    if (streak === 0) return null;

    return {
        id: "activity-streak",
        type: streak >= 7 ? "positive" : streak >= 3 ? "info" : "info",
        title: `${streak}-Day Streak`,
        description:
            streak >= 7
                ? `${streak} consecutive days active — you're on fire 🔥`
                : `${streak} consecutive days with activity — keep it going`,
        priority: streak >= 7 ? 8 : streak >= 3 ? 5 : 2,
    };
}

/** 8. Pattern: high focus + low completion → warning */
function patternHighFocusLowCompletion(
    sessions: FocusSession[],
    todos: TodoItem[]
): Insight | null {
    if (sessions.length === 0 || todos.length === 0) return null;

    const now = Date.now();
    const weekAgo = now - 7 * MS_PER_DAY;
    const weekFocusMinutes =
        sessions
            .filter((s) => s.startTime >= weekAgo)
            .reduce((a, s) => a + s.duration, 0) / 60;

    const completed = todos.filter((t) => t.completed).length;
    const rate = completed / todos.length;

    // High focus (> 120 min/week) but low completion (< 30%)
    if (weekFocusMinutes > 120 && rate < 0.3) {
        return {
            id: "pattern-focus-vs-completion",
            type: "warning",
            title: "Focus ≠ Execution",
            description: `${Math.round(weekFocusMinutes)} min focused this week but only ${Math.round(rate * 100)}% tasks done — try breaking tasks smaller`,
            priority: 9,
        };
    }

    return null;
}

/** 9. Pattern: high completion + low focus → info */
function patternHighCompletionLowFocus(
    sessions: FocusSession[],
    todos: TodoItem[]
): Insight | null {
    if (sessions.length === 0 || todos.length === 0) return null;

    const now = Date.now();
    const weekAgo = now - 7 * MS_PER_DAY;
    const weekFocusMinutes =
        sessions
            .filter((s) => s.startTime >= weekAgo)
            .reduce((a, s) => a + s.duration, 0) / 60;

    const completed = todos.filter((t) => t.completed).length;
    const rate = completed / todos.length;

    // High completion (> 70%) but low focus (< 30 min)
    if (rate > 0.7 && weekFocusMinutes < 30) {
        return {
            id: "pattern-completion-vs-focus",
            type: "info",
            title: "Quick Wins",
            description: `${Math.round(rate * 100)}% completion with only ${Math.round(weekFocusMinutes)} min focus — consider using focus mode for deeper work`,
            priority: 4,
        };
    }

    return null;
}

/** 9b. Low Focus Alert */
function lowFocusAlert(sessions: FocusSession[]): Insight | null {
    const hour = new Date().getHours();
    if (hour < 18) return null; // Only alert in the evening

    const todayStr = new Date().toISOString().slice(0, 10);
    const focusSessionsToday = sessions.filter(
        (s) => new Date(s.startTime).toISOString().slice(0, 10) === todayStr
    ).length;

    if (focusSessionsToday === 0) {
        return {
            id: "low-focus-alert",
            type: "warning",
            title: "Low Focus Today",
            description: "You haven't explicitly focused today. Try a quick 15-minute session to build the habit.",
            priority: 8,
        };
    }
    return null;
}

/** 9c. Momentum Signal */
function momentumSignal(sessions: FocusSession[]): Insight | null {
    const todayStr = new Date().toISOString().slice(0, 10);
    const focusSessionsToday = sessions.filter(
        (s) => new Date(s.startTime).toISOString().slice(0, 10) === todayStr
    ).length;

    if (focusSessionsToday >= 2) {
        return {
            id: "momentum-signal",
            type: "positive",
            title: "Building Momentum",
            description: `You've completed ${focusSessionsToday} focus sessions today. You're in the zone!`,
            priority: 7,
        };
    }
    return null;
}

/** 9d. Stalled Projects Alert */
function stalledProjectsAlert(projects: Project[]): Insight | null {
    if (projects.length === 0) return null;

    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const now = Date.now();
    let stalledCount = 0;

    projects.forEach(p => {
        // Check for uncompleted tasks
        const hasIncomplete = p.tasks.some(t => t.status !== "done" || t.subtasks?.some(st => !st.completed));
        if (!hasIncomplete) return;

        if (p.lastWorkedDate) {
            const lastWorked = new Date(p.lastWorkedDate).getTime();
            if (Math.floor((now - lastWorked) / MS_PER_DAY) > 3) stalledCount++;
        } else {
            if (Math.floor((now - p.createdAt) / MS_PER_DAY) > 3) stalledCount++;
        }
    });

    if (stalledCount > 0) {
        return {
            id: "stalled-projects",
            type: "warning",
            title: "Projects Stalled",
            description: `${stalledCount} active project${stalledCount > 1 ? "s are" : " is"} stalled. Consider breaking tasks down.`,
            priority: 8,
        };
    }
    return null;
}

/** 10. Productivity Score (0–100) */
function productivityScore(input: InsightInput): Insight | null {
    const { focusSessions, todos, projects } = input;

    // Focus component (0–40 points): weekly minutes / 300 (5h target), capped at 40
    const now = Date.now();
    const weekAgo = now - 7 * MS_PER_DAY;
    const weekFocusMin =
        focusSessions
            .filter((s) => s.startTime >= weekAgo)
            .reduce((a, s) => a + s.duration, 0) / 60;
    const focusScore = Math.min(40, Math.round((weekFocusMin / 300) * 40));

    // Task component (0–35 points): completion rate * 35
    const taskRate = todos.length > 0 ? todos.filter((t) => t.completed).length / todos.length : 0;
    const taskScore = Math.round(taskRate * 35);

    // Streak component (0–25 points): streak days / 7, capped at 25
    const dates = new Set<string>();
    focusSessions.forEach((s) => dates.add(toDateStr(s.startTime)));
    todos.forEach((t) => { if (t.completed) dates.add(toDateStr(t.createdAt)); });
    projects.forEach((p) => { if (p.lastWorkedDate) dates.add(p.lastWorkedDate); });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    const check = new Date(today);
    if (!dates.has(toDateStr(check.getTime()))) check.setDate(check.getDate() - 1);
    while (dates.has(toDateStr(check.getTime()))) {
        streak++;
        check.setDate(check.getDate() - 1);
    }
    const streakScore = Math.min(25, Math.round((streak / 7) * 25));

    const total = focusScore + taskScore + streakScore;

    const type = total >= 70 ? "positive" : total >= 40 ? "info" : "warning";
    const emoji = total >= 80 ? "🔥" : total >= 60 ? "⚡" : total >= 40 ? "📈" : "🎯";

    return {
        id: "productivity-score",
        type,
        title: `Score: ${total}/100 ${emoji}`,
        description: `Focus: ${focusScore}/40 • Tasks: ${taskScore}/35 • Streak: ${streakScore}/25`,
        priority: 10, // always show this first
    };
}

/* ── Main Export ── */

export function generateInsights(input: InsightInput, context?: DashboardContextValue): Insight[] {
    const { focusSessions, todos, projects } = input;

    const all: (Insight | Insight[] | null)[] = [
        productivityScore(input),
        overdueTasks(todos),
        patternHighFocusLowCompletion(focusSessions, todos),
        weeklyFocusTrend(focusSessions),
        peakFocusHour(focusSessions),
        todoCompletion(todos),
        activityStreak(focusSessions, todos, projects),
        projectProgress(projects),
        mostActiveProject(projects),
        patternHighCompletionLowFocus(focusSessions, todos),
        lowFocusAlert(focusSessions),
        momentumSignal(focusSessions),
        stalledProjectsAlert(projects)
    ];

    // Flatten insights (todoCompletion returns an array now)
    const flatInsights: Insight[] = all.reduce<Insight[]>((acc, val) => {
        if (val === null) return acc;
        if (Array.isArray(val)) return [...acc, ...val];
        return [...acc, val];
    }, []);

    const sortedStatic = flatInsights
        .sort((a, b) => b.priority - a.priority)
        .slice(0, MAX_INSIGHTS);

    let predictive: Insight[] = [];
    if (context && context.patterns) {
        const preds = generatePredictiveInsights(context.patterns, context);
        predictive = preds.map((p) => ({
            id: p.id,
            type: "predictive",
            title: "SMART",
            description: p.message,
            priority: 100, // force top
            isPredictive: true,
        }));
    }

    return [...predictive, ...sortedStatic].slice(0, MAX_INSIGHTS);
}
