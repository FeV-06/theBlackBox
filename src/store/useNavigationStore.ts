"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TabId } from "@/types/widget";

interface NavigationState {
    activeTab: TabId;
    setActiveTab: (tab: TabId) => void;
}

export const useNavigationStore = create<NavigationState>()(
    persist(
        (set) => ({
            activeTab: "dashboard",
            setActiveTab: (tab) => set({ activeTab: tab }),
        }),
        {
            name: "tbb-navigation",
        }
    )
);
