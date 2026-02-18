import { useEffect } from "react";
import type { TabId } from "@/types/widget";
import WidgetCanvas from "@/components/widgets/WidgetCanvas";

interface DashboardTabProps {
    onNavigate?: (tab: TabId) => void;
}

import { useSettingsStore } from "@/store/useSettingsStore";
import { useWidgetStore } from "@/store/useWidgetStore";
import { Hammer, Check, Undo2, Redo2 } from "lucide-react";

export default function DashboardTab({ onNavigate }: DashboardTabProps) {
    const { dashboardEditMode, toggleDashboardEditMode } = useSettingsStore();
    const undo = useWidgetStore((s) => s.undo);
    const redo = useWidgetStore((s) => s.redo);
    const hasPast = useWidgetStore((s) => s.historyPast.length > 0);
    const hasFuture = useWidgetStore((s) => s.historyFuture.length > 0);

    /* ─── Keyboard shortcuts ─── */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            // Ignore when typing in inputs
            const tag = (e.target as HTMLElement)?.tagName;
            const editable = (e.target as HTMLElement)?.isContentEditable;
            if (tag === "INPUT" || tag === "TEXTAREA" || editable) return;

            const ctrl = e.ctrlKey || e.metaKey;

            if (ctrl && e.key === "z" && !e.shiftKey) {
                e.preventDefault();
                useWidgetStore.getState().undo();
            } else if (ctrl && e.key === "z" && e.shiftKey) {
                e.preventDefault();
                useWidgetStore.getState().redo();
            } else if (ctrl && e.key === "y") {
                e.preventDefault();
                useWidgetStore.getState().redo();
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    return (
        <div className="flex flex-col h-full overflow-hidden animate-fade-in px-4 md:px-6 py-4 md:py-6">
            {/* Header controls for Edit Mode */}
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                        Dashboard
                    </h1>
                    <p className="text-sm mt-1 opacity-60" style={{ color: "var(--color-text-secondary)" }}>
                        {dashboardEditMode
                            ? "Drag and resize widgets to customize your layout."
                            : "Your personal control-panel dashboard."}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {dashboardEditMode && (
                        <>
                            <span className="hidden sm:inline-block text-[10px] uppercase tracking-widest font-bold text-purple-400 animate-pulse px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20">
                                Layout Edit Mode
                            </span>
                            <button
                                onClick={undo}
                                disabled={!hasPast}
                                className="p-2 rounded-lg transition-all duration-200 border border-white/10 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed"
                                style={{ color: "var(--color-text-secondary)" }}
                                title="Undo (Ctrl+Z)"
                            >
                                <Undo2 size={14} />
                            </button>
                            <button
                                onClick={redo}
                                disabled={!hasFuture}
                                className="p-2 rounded-lg transition-all duration-200 border border-white/10 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed"
                                style={{ color: "var(--color-text-secondary)" }}
                                title="Redo (Ctrl+Shift+Z)"
                            >
                                <Redo2 size={14} />
                            </button>
                        </>
                    )}
                    <button
                        onClick={toggleDashboardEditMode}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${dashboardEditMode
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                            : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/80"
                            }`}
                    >
                        {dashboardEditMode ? (
                            <>
                                <Check size={14} className="animate-bounce-in" />
                                <span>Done</span>
                            </>
                        ) : (
                            <>
                                <Hammer size={14} />
                                <span>Edit Layout</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto rounded-3xl bg-black/5 border border-white/5">
                <WidgetCanvas onNavigate={onNavigate} />
            </div>
        </div>
    );
}
