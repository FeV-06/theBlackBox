"use client";

import type { TabId } from "@/types/widget";
import WidgetGrid from "@/components/widgets/WidgetGrid";

interface DashboardTabProps {
    onNavigate?: (tab: TabId) => void;
}

export default function DashboardTab({ onNavigate }: DashboardTabProps) {
    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                        Dashboard
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                        Drag widgets to reorder • Click ✕ to hide
                    </p>
                </div>
            </div>
            <WidgetGrid onNavigate={onNavigate} />
        </div>
    );
}
