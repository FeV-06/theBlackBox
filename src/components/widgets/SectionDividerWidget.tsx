"use client";

import { useWidgetStore } from "@/store/useWidgetStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import type { WidgetInstance } from "@/types/widgetInstance";
import { useState, useRef, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";

interface DividerConfig {
    label: string;
    style: "line" | "box" | "glow";
    accent?: boolean;
}

export default function SectionDividerWidget({ instance }: { instance: WidgetInstance }) {
    const { updateInstanceConfig } = useWidgetStore();
    const dashboardEditMode = useSettingsStore((s) => s.dashboardEditMode);

    // Config values
    const config = instance.config as unknown as DividerConfig;
    const label = config.label ?? "New Section";
    const style = config.style ?? "line";
    const accent = config.accent ?? false;

    // Editing state
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(label);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        if (editValue.trim()) {
            updateInstanceConfig(instance.instanceId, { label: editValue.trim() });
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") {
            setEditValue(label);
            setIsEditing(false);
        }
    };

    const toggleStyle = () => {
        if (!dashboardEditMode) return;
        const styles: ("line" | "box" | "glow")[] = ["line", "box", "glow"];
        const nextStyle = styles[(styles.indexOf(style) + 1) % styles.length];
        updateInstanceConfig(instance.instanceId, { style: nextStyle });
    };

    // Render logic per style
    const renderContent = () => {
        if (isEditing) {
            return (
                <div className="flex items-center justify-center w-full">
                    <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleSave}
                        className="bg-black/50 border border-purple-500/50 rounded px-4 py-1 text-center text-lg font-bold text-white outline-none ring-2 ring-purple-500/30"
                        style={{ minWidth: "200px" }}
                    />
                </div>
            );
        }

        const LabelText = () => (
            <span
                className={`text-lg font-bold tracking-wider uppercase truncate max-w-full px-4 py-1
                    ${accent ? "text-[color:var(--color-accent)]" : "text-white/80"}
                `}
                onDoubleClick={() => dashboardEditMode && setIsEditing(true)}
                title={dashboardEditMode ? "Double-click to edit label" : ""}
            >
                {label}
            </span>
        );

        switch (style) {
            case "box":
                return (
                    <div className="flex items-center justify-center w-full h-full">
                        <div className="bg-white/[0.03] border border-white/10 rounded-xl px-8 py-3 backdrop-blur-md shadow-lg flex items-center gap-3">
                            <div className="w-1.5 h-6 rounded-full bg-[color:var(--color-accent)]" />
                            <LabelText />
                        </div>
                    </div>
                );
            case "glow":
                return (
                    <div className="flex flex-col items-center justify-center w-full h-full relative overflow-visible">
                        <div className="absolute inset-0 flex items-center justify-center opacity-30 blur-2xl pointer-events-none">
                            <div className="w-1/2 h-1/2 bg-[color:var(--color-accent)] rounded-full" />
                        </div>
                        <LabelText />
                        <div className="h-0.5 w-1/3 mt-2 bg-gradient-to-r from-transparent via-[color:var(--color-accent)] to-transparent opacity-70" />
                    </div>
                );
            case "line":
            default:
                return (
                    <div className="flex items-center w-full h-full gap-4">
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-white/50 to-white/10" />
                        <LabelText />
                        <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-white/50 to-white/10" />
                    </div>
                );
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center relative group">
            {renderContent()}

            {/* Config Controls (Edit Mode) */}
            {dashboardEditMode && !isEditing && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 bg-black/80 rounded-lg p-1 border border-white/10 z-10">
                    <button onClick={() => setIsEditing(true)} className="p-1.5 hover:bg-white/10 rounded text-white/50 hover:text-white" title="Rename">
                        <Pencil size={12} />
                    </button>
                    <button onClick={toggleStyle} className="p-1.5 hover:bg-white/10 rounded text-white/50 hover:text-white text-[10px] font-mono leading-none flex items-center justify-center w-6 h-6 border border-white/10" title="Cycle Style">
                        S
                    </button>
                </div>
            )}
        </div>
    );
}
