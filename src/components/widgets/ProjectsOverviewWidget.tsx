"use client";

import { useProjectStore } from "@/store/useProjectStore";
import { FolderKanban, ArrowRight, Trash2 } from "lucide-react";
import type { TabId } from "@/types/widget";
import type { WidgetInstance } from "@/types/widgetInstance";

interface ProjectsOverviewWidgetProps {
    instance: WidgetInstance;
    onNavigate?: (tab: TabId) => void;
}

export default function ProjectsOverviewWidget({ instance, onNavigate }: ProjectsOverviewWidgetProps) {
    const { projects, deleteProject, setSelectedProjectId } = useProjectStore();

    return (
        <div className="flex flex-col h-full gap-3 @md:gap-4 @xl:gap-5 overflow-hidden @container">
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col gap-2 @md:gap-3 @xl:gap-4 pr-1">
                {projects.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-6 @md:py-8 @xl:py-10 opacity-20 gap-2 @md:gap-3">
                        <FolderKanban className="w-6 h-6 @md:w-8 @md:h-8 @xl:w-10 @xl:h-10 transition-all" />
                        <p className="text-[10px] @md:text-xs @xl:text-sm uppercase font-bold tracking-widest text-center px-4 transition-all">
                            No projects yet
                        </p>
                    </div>
                ) : (
                    projects.map((project) => {
                        const totalTasks = project.tasks.length + project.tasks.reduce((sum, t) => sum + (t.subtasks?.length || 0), 0);
                        const doneTasks = project.tasks.filter((t) => t.status === "done").length +
                            project.tasks.reduce((sum, t) => sum + (t.subtasks?.filter(st => st.completed).length || 0), 0);
                        const progress = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0;
                        return (
                            <div
                                key={project.id}
                                className="group flex flex-col gap-2 @md:gap-3 p-3 @md:p-4 @xl:p-5 rounded-2xl border border-white/[0.03] transition-all hover:bg-white/[0.02] relative cursor-pointer"
                                style={{ background: "rgba(255,255,255,0.01)" }}
                                onClick={() => {
                                    setSelectedProjectId(project.id);
                                    onNavigate?.("projects");
                                }}
                            >
                                <div className="flex items-center gap-2 @md:gap-3">
                                    <div
                                        className="w-2.5 h-2.5 @md:w-3.5 @md:h-3.5 @xl:w-4.5 @xl:h-4.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] transition-all"
                                        style={{ background: project.color, boxShadow: `0 0 10px ${project.color}40` }}
                                    />
                                    <span className="text-xs @md:text-sm @xl:text-base font-bold truncate flex-1 tracking-tight transition-all" style={{ color: "var(--color-text-primary)" }}>
                                        {project.name}
                                    </span>
                                    <span className="text-[10px] @md:text-xs @xl:text-sm font-bold opacity-30 group-hover:opacity-0 transition-all absolute right-4 @md:right-6">
                                        {doneTasks}/{totalTasks}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm("Are you sure you want to delete this project? All tasks will be lost.")) {
                                                deleteProject(project.id);
                                            }
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 @md:p-2 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all absolute right-2 @md:right-4 top-1.5 @md:top-2.5"
                                        title="Delete Project"
                                    >
                                        <Trash2 className="w-3 h-3 @md:w-4 @md:h-4" />
                                    </button>
                                </div>
                                <div className="h-1 @md:h-1.5 @xl:h-2 rounded-full mt-1 @md:mt-2 transition-all" style={{ background: "rgba(255,255,255,0.04)" }}>
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
                className="shrink-0 flex items-center justify-center gap-2 py-2 @md:py-3 @xl:py-4 text-[10px] @md:text-xs @xl:text-sm font-bold uppercase tracking-widest rounded-xl transition-all bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05]"
                style={{ color: "var(--color-accent)" }}
            >
                View All Projects <ArrowRight className="w-3 h-3 @md:w-4 @md:h-4 @xl:w-5 @xl:h-5 transition-all" />
            </button>
        </div>
    );
}
