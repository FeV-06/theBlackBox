"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TabId } from "@/types/widget";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import Header from "./Header";
import DashboardTab from "@/components/tabs/DashboardTab";
import ProjectsTab from "@/components/tabs/ProjectsTab";
import FocusTab from "@/components/tabs/FocusTab";
import CalendarTab from "@/components/tabs/CalendarTab";
import SettingsTab from "@/components/tabs/SettingsTab";
import WidgetsTab from "@/components/tabs/WidgetsTab";
import FocusTimerManager from "./FocusTimerManager";
import { useEffect } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";

const tabComponents: Record<TabId, React.ComponentType<{ onNavigate?: (tab: TabId) => void }>> = {
    dashboard: DashboardTab,
    projects: ProjectsTab,
    focus: FocusTab,
    calendar: CalendarTab,
    widgets: WidgetsTab,
    settings: SettingsTab,
};

import { useNavigationStore } from "@/store/useNavigationStore";

export default function DashboardShell() {
    const activeTab = useNavigationStore((s) => s.activeTab);
    const setActiveTab = useNavigationStore((s) => s.setActiveTab);
    const setDashboardEditMode = useSettingsStore((s) => s.setDashboardEditMode);
    const enablePremiumVisuals = useSettingsStore((s) => s.enablePremiumVisuals);

    useEffect(() => {
        setDashboardEditMode(false);
    }, [setDashboardEditMode]);

    const ActiveComponent = tabComponents[activeTab];
    const isDashboard = activeTab === "dashboard";

    return (
        <div className="flex h-screen">
            <FocusTimerManager />
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
            <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="flex flex-col flex-1 ml-0 md:ml-[72px] min-h-0">
                <Header />
                {/* main is always overflow-hidden — each tab controls its own scroll */}
                <main className="flex-1 overflow-hidden min-h-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={enablePremiumVisuals ? { opacity: 0, x: 40 } : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, x: 0, y: 0 }}
                            exit={enablePremiumVisuals ? { opacity: 0, x: -40 } : { opacity: 0, y: -8 }}
                            transition={enablePremiumVisuals
                                ? { type: "spring", stiffness: 350, damping: 40, mass: 0.8 }
                                : { duration: 0.2, ease: "easeInOut" }
                            }
                            className="h-full"
                        >
                            {/* Dashboard fills full screen on mobile, no padding.
                                All other tabs get their own scrollable padded container. */}
                            {isDashboard ? (
                                <ActiveComponent onNavigate={setActiveTab} />
                            ) : (
                                <div className="h-full overflow-y-auto p-3 pb-24 sm:p-4 md:p-6 md:pb-6">
                                    <ActiveComponent onNavigate={setActiveTab} />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
