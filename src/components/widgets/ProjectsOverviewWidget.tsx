"use client";

import { useProjectStore } from "@/store/useProjectStore";
import { FolderKanban, ArrowRight } from "lucide-react";
import type { TabId } from "@/types/widget";
import type { WidgetInstance } from "@/types/widgetInstance";

interface ProjectsOverviewWidgetProps {
    instance: WidgetInstance;
    onNavigate?: (tab: TabId) => void;
}

export default function ProjectsOverviewWidget({ instance, onNavigate }: ProjectsOverviewWidgetProps) {
    const projects = useProjectStore((s) => s.projects);
    const topProjects = projects.slice(0, 3);

    return (
        <div className="flex flex-col gap-3">
            {topProjects.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: "var(--color-text-muted)" }}>
                    No projects yet. Create one in the Projects tab!
                </p>
            ) : (
                topProjects.map((project) => {
                    const totalTasks = project.tasks.length;
                    const doneTasks = project.tasks.filter((t) => t.done).length;
                    const progress = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0;
                    return (
                        <div
                            key={project.id}
                            className="flex flex-col gap-2 p-3 rounded-xl"
                            style={{ background: "rgba(255,255,255,0.02)" }}
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ background: project.color }}
                                />
                                <span className="text-sm font-medium flex-1 truncate" style={{ color: "var(--color-text-primary)" }}>
                                    {project.name}
                                </span>
                                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                                    {doneTasks}/{totalTasks}
                                </span>
                            </div>
                            <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${progress}%`,
                                        background: project.color,
                                    }}
                                />
                            </div>
                        </div>
                    );
                })
            )}

            <button
                onClick={() => onNavigate?.("projects")}
                className="flex items-center justify-center gap-2 py-2 text-xs rounded-xl transition-all hover:bg-white/[0.03]"
                style={{ color: "var(--color-accent)" }}
            >
                View All Projects <ArrowRight size={12} />
            </button>
        </div>
    );
}
