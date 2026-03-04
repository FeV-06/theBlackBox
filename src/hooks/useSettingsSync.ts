"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { createClient } from "@/lib/supabase/client";

/**
 * useSettingsSync
 * 
 * Simple sync hook for global user settings.
 * Since settings is a single object per user, we don't use the generic sync engine
 * but a simple debounced upsert.
 */
export function useSettingsSync() {
    const user = useAuthStore((s) => s.user);
    const settings = useSettingsStore();

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRun = useRef(true);

    // 1. Initial Pull
    useEffect(() => {
        if (!user) return;

        const hydrate = async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("user_settings")
                .select("settings, updated_at")
                .eq("user_id", user.id)
                .maybeSingle();

            if (data && !error) {
                // Last-write-wins: simplified
                // In a production app, we'd check timestamps, but for settings, 
                // we usually prefer to hydrate the local store on first login.
                useSettingsStore.setState(data.settings);
            }
            isFirstRun.current = false;
        };

        hydrate();
    }, [user?.id]);

    // 2. Push on Change
    useEffect(() => {
        if (!user || isFirstRun.current) return;

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            const supabase = createClient();

            // Extract only the fields we want to persist (exclude ephemeral UI state if any)
            // useSettingsStore already has a partialize if it's using persist, 
            // but we'll just take the whole state for now as it's small.
            const {
                dashboardEditMode, // unwanted? maybe.
                ...persistentSettings
            } = useSettingsStore.getState();

            await supabase.from("user_settings").upsert({
                user_id: user.id,
                settings: persistentSettings,
                updated_at: new Date().toISOString(),
            });
        }, 3000);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [settings, user?.id]);
}
