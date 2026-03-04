"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useProjectStore } from "@/store/useProjectStore";
import { createSyncedStore } from "@/lib/sync/createSyncedStore";
import { projectToRow, rowToProject, taskToRow, rowToTask, type ProjectRow, type TaskRow } from "@/lib/sync/projectSync";
import type { Project } from "@/types/widget";

export function useProjectSync() {
    const user = useAuthStore((s) => s.user);

    useEffect(() => {
        if (!user) return;

        // Local-scoped state — no useRef needed, lives in closure
        let prevProjects: Project[] = useProjectStore.getState().projects;
        const remoteAppliedProjectIds = new Set<string>();
        const remoteAppliedTaskIds = new Set<string>();

        const projectEngine = createSyncedStore<ProjectRow>({
            table: "projects",
            deviceId: "web",
            debounceMs: 2000,
            onRemoteChange: (row) => {
                const remote = rowToProject(row);
                remoteAppliedProjectIds.add(remote.id);
                useProjectStore.setState(s => ({
                    projects: s.projects.some(p => p.id === remote.id)
                        ? s.projects.map(p => p.id === remote.id ? { ...p, ...remote, tasks: p.tasks } : p)
                        : [...s.projects, remote]
                }));
                remoteAppliedProjectIds.delete(remote.id);
            },
            onRemoteDelete: (id) => {
                projectEngine.cancel(id);
                remoteAppliedProjectIds.add(id);
                useProjectStore.setState(s => ({
                    projects: s.projects.filter(p => p.id !== id)
                }));
                remoteAppliedProjectIds.delete(id);
            }
        });

        const taskEngine = createSyncedStore<TaskRow>({
            table: "tasks",
            deviceId: "web",
            debounceMs: 2000,
            onRemoteChange: (row) => {
                const remoteTask = rowToTask(row);
                remoteAppliedTaskIds.add(remoteTask.id);
                useProjectStore.setState(s => ({
                    projects: s.projects.map(p => {
                        if (p.id !== row.project_id) return p;
                        const taskExists = p.tasks.some(t => t.id === remoteTask.id);
                        return {
                            ...p,
                            tasks: taskExists
                                ? p.tasks.map(t => t.id === remoteTask.id ? remoteTask : t)
                                : [...p.tasks, remoteTask].sort((a, b) => a.order - b.order)
                        };
                    })
                }));
                remoteAppliedTaskIds.delete(remoteTask.id);
            },
            onRemoteDelete: (id) => {
                taskEngine.cancel(id);
                remoteAppliedTaskIds.add(id);
                useProjectStore.setState(s => ({
                    projects: s.projects.map(p => ({
                        ...p,
                        tasks: p.tasks.filter(t => t.id !== id)
                    }))
                }));
                remoteAppliedTaskIds.delete(id);
            }
        });

        /* ── Initial Hydration ── */
        const hydrate = async () => {
            const [pRows, tRows] = await Promise.all([
                projectEngine.pull(),
                taskEngine.pull()
            ]);

            if (pRows.length === 0 && tRows.length === 0) return;

            // Mark all pulled IDs as remote so subscribe ignores them
            pRows.forEach(r => remoteAppliedProjectIds.add(r.id));
            tRows.forEach(r => remoteAppliedTaskIds.add(r.id));

            useProjectStore.setState(s => {
                const mergedProjects = [...s.projects];

                for (const pRow of pRows) {
                    const remoteP = rowToProject(pRow);
                    const existingIdx = mergedProjects.findIndex(p => p.id === remoteP.id);
                    if (existingIdx === -1) {
                        mergedProjects.push(remoteP);
                    } else {
                        const local = mergedProjects[existingIdx];
                        const remoteTs = new Date(pRow.updated_at || 0).getTime();
                        if (local.createdAt < remoteTs) {
                            mergedProjects[existingIdx] = { ...local, ...remoteP, tasks: local.tasks };
                        }
                    }
                }

                for (const tRow of tRows) {
                    const remoteT = rowToTask(tRow);
                    const project = mergedProjects.find(p => p.id === tRow.project_id);
                    if (!project) continue;
                    const taskIdx = project.tasks.findIndex(t => t.id === remoteT.id);
                    if (taskIdx === -1) {
                        project.tasks.push(remoteT);
                    } else {
                        const remoteTs = new Date(tRow.updated_at || 0).getTime();
                        if (project.tasks[taskIdx].createdAt < remoteTs) {
                            project.tasks[taskIdx] = remoteT;
                        }
                    }
                }

                mergedProjects.forEach(p => p.tasks.sort((a, b) => a.order - b.order));
                return { projects: mergedProjects };
            });

            pRows.forEach(r => remoteAppliedProjectIds.delete(r.id));
            tRows.forEach(r => remoteAppliedTaskIds.delete(r.id));
        };

        hydrate();

        const unsubP = projectEngine.subscribe();
        const unsubT = taskEngine.subscribe();

        /* ── Synchronous Zustand subscribe for push ── */
        const unsubStore = useProjectStore.subscribe((state, prev) => {
            const currentProjects = state.projects;
            const currentProjectIds = new Set(currentProjects.map(p => p.id));

            // 1. Push additions and updates
            for (const p of currentProjects) {
                if (remoteAppliedProjectIds.has(p.id)) continue;

                const prevP = prevProjects.find(old => old.id === p.id);
                if (p !== prevP) {
                    projectEngine.push(projectToRow(p, user.id));

                    // Push changed tasks
                    for (const t of p.tasks) {
                        if (remoteAppliedTaskIds.has(t.id)) continue;
                        const prevT = prevP?.tasks.find(old => old.id === t.id);
                        if (t !== prevT) {
                            taskEngine.push(taskToRow(t, p.id, user.id));
                        }
                    }
                }
            }

            // 2. Push deletions
            for (const oldP of prevProjects) {
                const currentP = currentProjects.find(p => p.id === oldP.id);
                if (!currentP && !remoteAppliedProjectIds.has(oldP.id)) {
                    projectEngine.remove(oldP.id);
                    for (const oldT of oldP.tasks) {
                        taskEngine.remove(oldT.id);
                    }
                } else if (currentP && !remoteAppliedProjectIds.has(oldP.id)) {
                    for (const oldT of oldP.tasks) {
                        if (!currentP.tasks.some(t => t.id === oldT.id) && !remoteAppliedTaskIds.has(oldT.id)) {
                            taskEngine.remove(oldT.id);
                        }
                    }
                }
            }

            prevProjects = currentProjects;
        });

        return () => {
            projectEngine.destroy();
            taskEngine.destroy();
            unsubP();
            unsubT();
            unsubStore();
        };
    }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
}
