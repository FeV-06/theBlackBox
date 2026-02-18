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

const tabComponents: Record<TabId, React.ComponentType<{ onNavigate?: (tab: TabId) => void }>> = {
    dashboard: DashboardTab,
    projects: ProjectsTab,
    focus: FocusTab,
    calendar: CalendarTab,
    settings: SettingsTab,
};

export default function DashboardShell() {
    const [activeTab, setActiveTab] = useState<TabId>("dashboard");

    const ActiveComponent = tabComponents[activeTab];

    return (
        <div className="flex h-screen">
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
            <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="flex flex-col flex-1 ml-0 md:ml-[72px]">
                <Header />
                <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 pb-24 md:pb-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="h-full"
                        >
                            <ActiveComponent onNavigate={setActiveTab} />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
