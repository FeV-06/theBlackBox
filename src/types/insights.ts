export type TimeRange = "day" | "week" | "month";

export interface FocusPoint {
    date: string;
    minutes: number;
}

export interface TaskStats {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    byPriority: {
        low: number;
        medium: number;
        high: number;
    };
    completionRate: number;
}

export interface ProjectStat {
    id: string;
    name: string;
    color: string;
    totalItems: number;
    completedItems: number;
    progress: number;
    isComplete: boolean;
}

export interface ProjectStats {
    stats: ProjectStat[];
    total: number;
    active: number;
    completed: number;
    avgProgress: number;
}

export interface CombinedPoint {
    date: string;
    focusMinutes: number;
    tasksCompleted: number;
}

export interface InsightCard {
    text: string;
    type: "info" | "warning" | "success";
}
