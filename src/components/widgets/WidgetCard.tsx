"use client";

import { ReactNode } from "react";
import { GripVertical, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface WidgetCardProps {
    title: string;
    icon: LucideIcon;
    children: ReactNode;
    onRemove?: () => void;
    dragHandleProps?: Record<string, unknown>;
    className?: string;
}

export default function WidgetCard({
    title,
    icon: Icon,
    children,
    onRemove,
    dragHandleProps,
    className = "",
}: WidgetCardProps) {
    return (
        <div className={`glass-card flex flex-col overflow-hidden ${className}`}>
            {/* Title bar */}
            <div
                className="flex items-center gap-2 px-4 py-3 shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
            >
                {dragHandleProps && (
                    <button
                        {...dragHandleProps}
                        className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-white/5 transition-colors"
                        style={{ color: "var(--color-text-muted)" }}
                    >
                        <GripVertical size={16} />
                    </button>
                )}
                <Icon size={16} style={{ color: "var(--color-accent)" }} />
                <span className="text-sm font-medium flex-1" style={{ color: "var(--color-text-primary)" }}>
                    {title}
                </span>
                {onRemove && (
                    <button
                        onClick={onRemove}
                        className="p-1 rounded-lg hover:bg-white/5 transition-colors"
                        style={{ color: "var(--color-text-muted)" }}
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
            {/* Content */}
            <div className="flex-1 p-4 overflow-auto">{children}</div>
        </div>
    );
}
