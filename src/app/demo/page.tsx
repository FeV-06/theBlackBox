"use client";

import { useEffect, useState } from "react";
import WidgetCanvas from "@/components/widgets/WidgetCanvas";
import { useWidgetStore } from "@/store/useWidgetStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Hammer, Check } from "lucide-react";

const DEMO_WIDGETS = [
    { type: "quote_clock", label: "Quote & Clock", w: 360, h: 260 },
    { type: "github", label: "GitHub", w: 360, h: 260 },
    { type: "gmail", label: "Gmail", w: 360, h: 260 },
    { type: "weather", label: "Weather", w: 360, h: 260 },
    { type: "custom_api", label: "Custom API", w: 360, h: 260 }
] as const;

export default function DemoPage() {
    const { replaceDashboardState } = useWidgetStore();
    const { dashboardEditMode, setDashboardEditMode, toggleDashboardEditMode } = useSettingsStore();
    const [isMounted, setIsMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<string>(DEMO_WIDGETS[0].type);

    useEffect(() => {
        setIsMounted(true);
        // Force edit mode so the user can drag immediately
        setDashboardEditMode(true);

        const demoInstances: Record<string, any> = {};
        const demoLayout: string[] = [];

        DEMO_WIDGETS.forEach((dw, idx) => {
            const id = `demo_${dw.type}`;
            // Center the widget slightly (can be dragged later by user)
            const x = 60;
            const y = 80;

            demoInstances[id] = {
                instanceId: id,
                type: dw.type,
                enabled: dw.type === DEMO_WIDGETS[0].type,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                config: {},
                layout: { x, y, w: dw.w, h: dw.h },
                zIndex: idx + 1,
                isLocked: false,
                isCollapsed: false,
            };
            demoLayout.push(id);
        });

        replaceDashboardState({
            instances: demoInstances,
            layout: demoLayout,
            lockedGroups: {}
        });
    }, [replaceDashboardState, setDashboardEditMode]);

    // Fast active-tab switching via Zustand store mutation
    useEffect(() => {
        if (!isMounted) return;
        useWidgetStore.setState((s) => {
            const nextInstances = { ...s.instances };
            DEMO_WIDGETS.forEach((dw) => {
                const id = `demo_${dw.type}`;
                if (nextInstances[id]) {
                    nextInstances[id] = { ...nextInstances[id], enabled: dw.type === activeTab };
                }
            });
            return { instances: nextInstances };
        });
    }, [activeTab, isMounted]);

    if (!isMounted) return null;

    return (
        <div className="h-screen w-full bg-transparent overflow-hidden relative">
            {/* Custom Tab Bar for Demo Navigation */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-card/60 backdrop-blur-md border border-border shadow-xl w-[90%] max-w-max flex-wrap">
                {DEMO_WIDGETS.map((dw) => (
                    <button
                        key={dw.type}
                        onClick={() => setActiveTab(dw.type)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === dw.type
                            ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.3)]'
                            : 'text-muted-foreground hover:bg-accent hover:text-background border border-transparent'
                            }`}
                    >
                        {dw.label}
                    </button>
                ))}
            </div>

            {/* Edit Mode Toggle */}
            <div className="absolute top-4 right-4 z-50">
                <button
                    onClick={toggleDashboardEditMode}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${dashboardEditMode
                        ? "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/40 shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.15)]"
                        : "bg-card/60 backdrop-blur-md text-muted-foreground border border-border hover:bg-accent hover:text-background shadow-xl"
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

            {/* Fixed canvas to remove scrolling entirely */}
            <WidgetCanvas fullHeight={true} fixedCanvas={true} />
        </div>
    );
}
