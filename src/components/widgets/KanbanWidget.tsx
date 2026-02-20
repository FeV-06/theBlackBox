"use client";

import React, { useState, useMemo, memo } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import type { WidgetInstance } from "@/types/widgetInstance";
import { useWidgetStore } from "@/store/useWidgetStore";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import { LayoutGrid, ChevronDown } from "lucide-react";

interface KanbanWidgetProps {
    instance: WidgetInstance;
}

function KanbanWidgetInner({ instance }: KanbanWidgetProps) {
    const projects = useProjectStore((s) => s.projects);
    const updateInstanceConfig = useWidgetStore((s) => s.updateInstanceConfig);

    const projectFilter = instance.config?.projectFilter as string | undefined;
    const project = useMemo(
        () => projects.find((p) => p.id === projectFilter),
        [projects, projectFilter]
    );

    const [selectorOpen, setSelectorOpen] = useState(false);

    // No project selected → show selector
    if (!project) {
        return (
            <div className="flex flex-col h-full p-4 gap-3">
                <div className="flex items-center gap-2 mb-1">
                    <LayoutGrid size={16} style={{ color: "var(--color-accent)" }} />
                    <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                        Kanban Board
                    </span>
                </div>

                {projects.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-30">
                        <LayoutGrid size={32} />
                        <p className="text-xs text-center">No projects yet.<br />Create one in the Projects tab.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-1">
                            Select a project
                        </span>
                        {projects.map((p) => (
                            <button
                                key={p.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    updateInstanceConfig(instance.instanceId, { projectFilter: p.id });
                                }}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-all bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05]"
                                style={{ color: "var(--color-text-primary)" }}
                            >
                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                                <span className="truncate">{p.name}</span>
                                <span className="ml-auto text-[10px] opacity-30">{p.tasks.length} tasks</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Project selected → render kanban
    return (
        <div className="flex flex-col h-full overflow-hidden" onPointerDown={(e) => e.stopPropagation()}>
            {/* Header with project selector */}
            <div className="flex items-center gap-2 px-3 py-2 shrink-0 border-b border-white/[0.05]">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: project.color }} />
                <span className="text-xs font-bold truncate" style={{ color: "var(--color-text-primary)" }}>
                    {project.name}
                </span>

                {/* Project switcher */}
                <div className="relative ml-auto">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectorOpen(!selectorOpen);
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="p-1 rounded hover:bg-white/5 transition-all text-white/30 hover:text-white/70"
                    >
                        <ChevronDown size={12} />
                    </button>

                    {selectorOpen && (
                        <div
                            className="absolute right-0 top-7 z-50 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl p-1.5 min-w-[180px]"
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            {projects.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        updateInstanceConfig(instance.instanceId, { projectFilter: p.id });
                                        setSelectorOpen(false);
                                    }}
                                    className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs transition-all ${p.id === project.id ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                                        }`}
                                >
                                    <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                                    <span className="truncate">{p.name}</span>
                                </button>
                            ))}

                            <div className="border-t border-white/5 mt-1 pt-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        updateInstanceConfig(instance.instanceId, { projectFilter: undefined });
                                        setSelectorOpen(false);
                                    }}
                                    className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs text-white/40 hover:bg-white/5 hover:text-white/70 transition-all"
                                >
                                    Change project…
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Kanban board */}
            <div className="flex-1 min-h-0 overflow-auto p-2">
                <KanbanBoard project={project} hideCompleted={false} />
            </div>
        </div>
    );
}

export default memo(KanbanWidgetInner);
