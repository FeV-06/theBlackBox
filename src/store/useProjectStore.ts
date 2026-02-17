"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Project, ProjectTask, SubTask } from "@/types/widget";
import { generateId, getTodayStr } from "@/lib/utils";

interface ProjectState {
    projects: Project[];
    addProject: (name: string, description: string, color: string) => void;
    updateProject: (id: string, updates: Partial<Pick<Project, "name" | "description" | "color">>) => void;
    deleteProject: (id: string) => void;
    addTask: (projectId: string, text: string) => void;
    toggleTask: (projectId: string, taskId: string) => void;
    deleteTask: (projectId: string, taskId: string) => void;
    addSubtask: (projectId: string, taskId: string, text: string) => void;
    toggleSubtask: (projectId: string, taskId: string, subtaskId: string) => void;
    deleteSubtask: (projectId: string, taskId: string, subtaskId: string) => void;
    reorderTasks: (projectId: string, taskIds: string[]) => void;
    recordWork: (projectId: string) => void;
}

function updateProjectInList(
    projects: Project[],
    projectId: string,
    updater: (p: Project) => Project
): Project[] {
    return projects.map((p) => (p.id === projectId ? updater(p) : p));
}

function updateTaskInProject(
    project: Project,
    taskId: string,
    updater: (t: ProjectTask) => ProjectTask
): Project {
    return { ...project, tasks: project.tasks.map((t) => (t.id === taskId ? updater(t) : t)) };
}

export const useProjectStore = create<ProjectState>()(
    persist(
        (set) => ({
            projects: [],

            addProject: (name, description, color) =>
                set((s) => ({
                    projects: [
                        ...s.projects,
                        {
                            id: generateId(),
                            name,
                            description,
                            color,
                            tasks: [],
                            createdAt: Date.now(),
                            streakDays: 0,
                            lastWorkedDate: null,
                        },
                    ],
                })),

            updateProject: (id, updates) =>
                set((s) => ({
                    projects: updateProjectInList(s.projects, id, (p) => ({ ...p, ...updates })),
                })),

            deleteProject: (id) =>
                set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

            addTask: (projectId, text) =>
                set((s) => ({
                    projects: updateProjectInList(s.projects, projectId, (p) => ({
                        ...p,
                        tasks: [...p.tasks, { id: generateId(), text, done: false, subtasks: [] }],
                    })),
                })),

            toggleTask: (projectId, taskId) =>
                set((s) => ({
                    projects: updateProjectInList(s.projects, projectId, (p) =>
                        updateTaskInProject(p, taskId, (t) => ({ ...t, done: !t.done }))
                    ),
                })),

            deleteTask: (projectId, taskId) =>
                set((s) => ({
                    projects: updateProjectInList(s.projects, projectId, (p) => ({
                        ...p,
                        tasks: p.tasks.filter((t) => t.id !== taskId),
                    })),
                })),

            addSubtask: (projectId, taskId, text) =>
                set((s) => ({
                    projects: updateProjectInList(s.projects, projectId, (p) =>
                        updateTaskInProject(p, taskId, (t) => ({
                            ...t,
                            subtasks: [...t.subtasks, { id: generateId(), text, done: false }],
                        }))
                    ),
                })),

            toggleSubtask: (projectId, taskId, subtaskId) =>
                set((s) => ({
                    projects: updateProjectInList(s.projects, projectId, (p) =>
                        updateTaskInProject(p, taskId, (t) => ({
                            ...t,
                            subtasks: t.subtasks.map((st: SubTask) =>
                                st.id === subtaskId ? { ...st, done: !st.done } : st
                            ),
                        }))
                    ),
                })),

            deleteSubtask: (projectId, taskId, subtaskId) =>
                set((s) => ({
                    projects: updateProjectInList(s.projects, projectId, (p) =>
                        updateTaskInProject(p, taskId, (t) => ({
                            ...t,
                            subtasks: t.subtasks.filter((st: SubTask) => st.id !== subtaskId),
                        }))
                    ),
                })),

            reorderTasks: (projectId, taskIds) =>
                set((s) => ({
                    projects: updateProjectInList(s.projects, projectId, (p) => {
                        const taskMap = new Map(p.tasks.map((t) => [t.id, t]));
                        return {
                            ...p,
                            tasks: taskIds.map((id) => taskMap.get(id)!).filter(Boolean),
                        };
                    }),
                })),

            recordWork: (projectId) =>
                set((s) => ({
                    projects: updateProjectInList(s.projects, projectId, (p) => {
                        const today = getTodayStr();
                        if (p.lastWorkedDate === today) return p;
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        const yesterdayStr = yesterday.toISOString().slice(0, 10);
                        const newStreak =
                            p.lastWorkedDate === yesterdayStr ? p.streakDays + 1 : 1;
                        return { ...p, streakDays: newStreak, lastWorkedDate: today };
                    }),
                })),
        }),
        { name: "tbb-projects" }
    )
);
