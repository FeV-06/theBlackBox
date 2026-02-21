"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Project, ProjectTask, ProjectSubtask } from "@/types/widget";
import { generateId, getTodayStr } from "@/lib/utils";

interface ProjectState {
    projects: Project[];
    addProject: (name: string, description: string, color: string) => void;
    updateProject: (id: string, updates: Partial<Pick<Project, "name" | "description" | "color" | "viewMode">>) => void;
    deleteProject: (id: string) => void;

    // View State
    selectedProjectId: string | null;
    setSelectedProjectId: (id: string | null) => void;

    // Task Actions
    createTask: (projectId: string, text: string, status?: "todo" | "in_progress" | "done") => void;
    toggleTask: (projectId: string, taskId: string) => void;
    deleteTask: (projectId: string, taskId: string) => void;
    updateTask: (projectId: string, taskId: string, updates: Partial<ProjectTask>) => void;
    toggleTaskExpand: (projectId: string, taskId: string) => void;

    // Kanban Actions
    moveTaskStatus: (projectId: string, taskId: string, status: "todo" | "in_progress" | "done") => void;
    moveTaskBetweenColumns: (projectId: string, taskId: string, newStatus: "todo" | "in_progress" | "done", newIndex: number) => void;

    // Subtask Actions
    createSubtask: (projectId: string, taskId: string, text: string) => void;
    toggleSubtask: (projectId: string, taskId: string, subtaskId: string) => void;
    deleteSubtask: (projectId: string, taskId: string, subtaskId: string) => void;
    updateSubtask: (projectId: string, taskId: string, subtaskId: string, updates: Partial<ProjectSubtask>) => void;

    // Others
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
            selectedProjectId: null,

            setSelectedProjectId: (id) => set({ selectedProjectId: id }),

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

            createTask: (projectId, text, status = "todo") => {
                set((s) => ({
                    projects: updateProjectInList(s.projects, projectId, (p) => {
                        const targetTasks = p.tasks.filter(t => t.status === status);
                        const maxOrder = targetTasks.length > 0 ? Math.max(...targetTasks.map(t => t.order || 0)) : -1;
                        return {
                            ...p,
                            tasks: [...p.tasks, {
                                id: generateId(),
                                text,
                                createdAt: Date.now(),
                                subtasks: [],
                                isExpanded: true,
                                status: status,
                                order: maxOrder + 1
                            }],
                        };
                    }),
                }));
            },

            toggleTask: (projectId, taskId) => {
                set((s) => ({
                    projects: updateProjectInList(s.projects, projectId, (p) =>
                        updateTaskInProject(p, taskId, (t) => {
                            let newStatus = t.status;
                            let newSubtasks = t.subtasks;

                            if (t.status === "done") {
                                newStatus = "todo";
                            } else {
                                newStatus = "done";
                                newSubtasks = t.subtasks.map(st => ({ ...st, completed: true }));
                            }

                            return {
                                ...t,
                                status: newStatus as "todo" | "in_progress" | "done",
                                subtasks: newSubtasks
                            };
                        })
                    ),
                }));
            },

            deleteTask: (projectId, taskId) =>
                set((s) => ({
                    projects: updateProjectInList(s.projects, projectId, (p) => ({
                        ...p,
                        tasks: p.tasks.filter((t) => t.id !== taskId),
                    })),
                })),

            updateTask: (projectId, taskId, updates) => {
                set((s) => ({
                    projects: updateProjectInList(s.projects, projectId, (p) =>
                        updateTaskInProject(p, taskId, (t) => ({ ...t, ...updates }))
                    ),
                }));
            },

            toggleTaskExpand: (projectId, taskId) =>
                set((s) => ({
                    projects: updateProjectInList(s.projects, projectId, (p) =>
                        updateTaskInProject(p, taskId, (t) => ({
                            ...t,
                            isExpanded: t.isExpanded === undefined ? false : !t.isExpanded
                        }))
                    ),
                })),

            createSubtask: (projectId, taskId, text) =>
                set((s) => ({
                    projects: updateProjectInList(s.projects, projectId, (p) =>
                        updateTaskInProject(p, taskId, (t) => {
                            const newSubtasks = [...t.subtasks, { id: generateId(), text, completed: false }];
                            // INVARIANT: Adding an incomplete subtask makes parent incomplete implicitly
                            return {
                                ...t,
                                status: t.status === "done" ? "in_progress" : t.status,
                                subtasks: newSubtasks,
                            };
                        })
                    ),
                })),

            toggleSubtask: (projectId, taskId, subtaskId) =>
                set((s) => ({
                    projects: updateProjectInList(s.projects, projectId, (p) =>
                        updateTaskInProject(p, taskId, (t) => {
                            const newSubtasks = t.subtasks.map((st: ProjectSubtask) =>
                                st.id === subtaskId ? { ...st, completed: !st.completed } : st
                            );

                            const allDone = newSubtasks.length > 0 && newSubtasks.every(st => st.completed);
                            let newStatus = t.status;

                            if (allDone) {
                                newStatus = "done";
                            } else if (t.status === "done") {
                                newStatus = "in_progress";
                            }

                            return {
                                ...t,
                                status: newStatus as "todo" | "in_progress" | "done",
                                subtasks: newSubtasks,
                            };
                        })
                    ),
                })),

            deleteSubtask: (projectId, taskId, subtaskId) =>
                set((s) => ({
                    projects: updateProjectInList(s.projects, projectId, (p) =>
                        updateTaskInProject(p, taskId, (t) => {
                            const newSubtasks = t.subtasks.filter((st: ProjectSubtask) => st.id !== subtaskId);

                            let newStatus = t.status;
                            if (newSubtasks.length > 0) {
                                const allDone = newSubtasks.every(st => st.completed);
                                if (allDone) {
                                    newStatus = "done";
                                } else if (t.status === "done") {
                                    newStatus = "in_progress";
                                }
                            }

                            return {
                                ...t,
                                status: newStatus as "todo" | "in_progress" | "done",
                                subtasks: newSubtasks,
                            };
                        })
                    ),
                })),

            updateSubtask: (projectId, taskId, subtaskId, updates) =>
                set((s) => ({
                    projects: updateProjectInList(s.projects, projectId, (p) =>
                        updateTaskInProject(p, taskId, (t) => ({
                            ...t,
                            subtasks: t.subtasks.map((st: ProjectSubtask) =>
                                st.id === subtaskId ? { ...st, ...updates } : st
                            ),
                        }))
                    ),
                })),

            moveTaskStatus: (projectId, taskId, status) =>
                set((s) => ({
                    projects: updateProjectInList(s.projects, projectId, (p) =>
                        updateTaskInProject(p, taskId, (t) => {
                            let newSubtasks = t.subtasks;
                            if (status === "done") {
                                newSubtasks = t.subtasks.map(st => ({ ...st, completed: true }));
                            }
                            return { ...t, status, subtasks: newSubtasks };
                        })
                    ),
                })),

            moveTaskBetweenColumns: (projectId, taskId, newStatus, newIndex) =>
                set((s) => ({
                    projects: updateProjectInList(s.projects, projectId, (p) => {
                        const taskIndex = p.tasks.findIndex(t => t.id === taskId);
                        if (taskIndex === -1) return p;

                        const taskToMove = p.tasks[taskIndex];
                        let newSubtasks = taskToMove.subtasks;

                        if (newStatus === "done") {
                            newSubtasks = taskToMove.subtasks.map(st => ({ ...st, completed: true }));
                        }

                        const updatedTask = {
                            ...taskToMove,
                            status: newStatus,
                            subtasks: newSubtasks
                        };

                        const remainingTasks = p.tasks.filter(t => t.id !== taskId);
                        const targetColumnTasks = remainingTasks.filter(t => t.status === newStatus).sort((a, b) => (a.order || 0) - (b.order || 0));

                        targetColumnTasks.splice(newIndex, 0, updatedTask);

                        // Recalculate orders to maintain stable sorting inside the specific column
                        targetColumnTasks.forEach((t, i) => {
                            t.order = i;
                        });

                        const otherTasks = remainingTasks.filter(t => t.status !== newStatus);

                        return {
                            ...p,
                            tasks: [...otherTasks, ...targetColumnTasks]
                        };
                    })
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
