"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useWidgetSync } from "@/hooks/useWidgetSync";
import { useFocusSync } from "@/hooks/useFocusSync";
import { useProjectSync } from "@/hooks/useProjectSync";
import { useSettingsSync } from "@/hooks/useSettingsSync";
import { useTemplateSync } from "@/hooks/useTemplateSync";

/**
 * AuthProvider
 * Mount once in the app root to:
 * 1. Bootstrap Supabase auth state (via onAuthStateChange)
 * 2. Start all background sync engines
 */
export default function AuthProvider() {
    const initialize = useAuthStore((s) => s.initialize);

    useEffect(() => {
        const unsubscribe = initialize();
        return unsubscribe;
    }, [initialize]);

    // Boot the background sync engines (they attach to auth state internally)
    useWidgetSync();
    useFocusSync();
    useProjectSync();
    useSettingsSync();
    useTemplateSync();

    return null;
}
