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
        <div className="flex flex-col h-full gap-3 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-1">
                {projects.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-6 opacity-20 gap-2">
                        <FolderKanban size={24} />
                        <p className="text-[10px] uppercase font-bold tracking-widest text-center px-4">
                            No projects yet
                        </p>
                    </div>
                ) : (
                    projects.map((project) => {
                        const totalTasks = project.tasks.length;
                        const doneTasks = project.tasks.filter((t) => t.done).length;
                        const progress = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0;
                        return (
                            <div
                                key={project.id}
                                className="flex flex-col gap-2 p-3 rounded-2xl border border-white/[0.03] transition-all hover:bg-white/[0.02]"
                                style={{ background: "rgba(255,255,255,0.01)" }}
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                                        style={{ background: project.color, boxShadow: `0 0 10px ${project.color}40` }}
                                    />
                                    <span className="text-xs font-bold truncate flex-1 tracking-tight" style={{ color: "var(--color-text-primary)" }}>
                                        {project.name}
                                    </span>
                                    <span className="text-[10px] font-bold opacity-30">
                                        {doneTasks}/{totalTasks}
                                    </span>
                                </div>
                                <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }}>
                                    <div
                                        className="h-full rounded-full transition-all duration-700 ease-out"
                                        style={{
                                            width: `${progress}%`,
                                            background: project.color,
                                            boxShadow: `0 0 10px ${project.color}30`,
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <button
                onClick={() => onNavigate?.("projects")}
                className="shrink-0 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05]"
                style={{ color: "var(--color-accent)" }}
            >
                View All Projects <ArrowRight size={12} />
            </button>
        </div>
    );
}
