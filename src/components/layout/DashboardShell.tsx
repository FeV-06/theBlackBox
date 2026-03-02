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
import FocusTimerManager from "./FocusTimerManager";
import { useEffect } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";

const tabComponents: Record<TabId, React.ComponentType<{ onNavigate?: (tab: TabId) => void }>> = {
    dashboard: DashboardTab,
    projects: ProjectsTab,
    focus: FocusTab,
    calendar: CalendarTab,
    settings: SettingsTab,
};

import { useNavigationStore } from "@/store/useNavigationStore";

export default function DashboardShell() {
    const { activeTab, setActiveTab } = useNavigationStore();
    const { setDashboardEditMode } = useSettingsStore();

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
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
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
