"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useTemplateStore } from "@/store/useTemplateStore";
import { createClient } from "@/lib/supabase/client";

/**
 * useTemplateSync
 * 
 * Simple sync hook for global user templates.
 */
export function useTemplateSync() {
    const user = useAuthStore((s) => s.user);
    const templates = useTemplateStore((s) => s.templates);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRun = useRef(true);

    // 1. Initial Pull
    useEffect(() => {
        if (!user) return;

        const hydrate = async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("user_templates")
                .select("templates, updated_at")
                .eq("user_id", user.id)
                .maybeSingle();

            if (data && !error && data.templates) {
                // Last-write-wins: simplified
                useTemplateStore.setState({ templates: data.templates });
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

            const currentTemplates = useTemplateStore.getState().templates;

            await supabase.from("user_templates").upsert({
                user_id: user.id,
                templates: currentTemplates,
                updated_at: new Date().toISOString(),
            });
        }, 3000);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [templates, user?.id]);
}
