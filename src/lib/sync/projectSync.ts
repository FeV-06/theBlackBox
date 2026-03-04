"use client";

import type { Project, ProjectTask } from "@/types/widget";

/**
 * ProjectRow — shape of a row in the Supabase `projects` table.
 */
export interface ProjectRow {
    id: string;
    user_id?: string;
    name: string;
    description: string;
    color: string;
    streak_days: number;
    last_worked_date: string | null;
    view_mode: string;
    device_id: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

/**
 * TaskRow — shape of a row in the Supabase `tasks` table.
 */
export interface TaskRow {
    id: string;
    user_id?: string;
    project_id: string | null;
    text: string;
    status: string;
    position: number;
    is_expanded: boolean;
    subtasks: any; // JSONB [{id, text, completed}]
    device_id: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

/** Convert Project -> ProjectRow */
export function projectToRow(p: Project, userId: string, deviceId = "web"): ProjectRow {
    return {
        id: p.id,
        user_id: userId,
        name: p.name,
        description: p.description,
        color: p.color,
        streak_days: p.streakDays,
        last_worked_date: p.lastWorkedDate,
        view_mode: p.viewMode ?? "list",
        device_id: deviceId,
        created_at: new Date(p.createdAt || Date.now()).toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
    };
}

/** Convert ProjectRow -> Project (partial, without tasks) */
export function rowToProject(row: ProjectRow): Project {
    return {
        id: row.id,
        name: row.name,
        description: row.description,
        color: row.color,
        streakDays: row.streak_days,
        lastWorkedDate: row.last_worked_date,
        viewMode: row.view_mode as "list" | "kanban",
        tasks: [], // tasks are pulled separately
        createdAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
    };
}

/** Convert ProjectTask -> TaskRow */
export function taskToRow(t: ProjectTask, projectId: string, userId: string, deviceId = "web"): TaskRow {
    return {
        id: t.id,
        user_id: userId,
        project_id: projectId,
        text: t.text,
        status: t.status,
        position: t.order,
        is_expanded: t.isExpanded ?? true,
        subtasks: t.subtasks,
        device_id: deviceId,
        created_at: new Date(t.createdAt || Date.now()).toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
    };
}

/** Convert TaskRow -> ProjectTask */
export function rowToTask(row: TaskRow): ProjectTask {
    return {
        id: row.id,
        text: row.text,
        status: row.status as "todo" | "in_progress" | "done",
        order: row.position,
        isExpanded: row.is_expanded,
        subtasks: row.subtasks,
        createdAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
    };
}
