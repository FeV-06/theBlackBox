"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthState {
    user: User | null;
    isConnected: boolean;
    loading: boolean;

    /** Trigger Google OAuth via Supabase (replaces connectWithPopup) */
    signInWithGoogle: () => Promise<void>;
    /** Sign out from Supabase (clears session + Google cookies via callback) */
    signOut: () => Promise<void>;
    /** Initialize auth state listener — call once in app root */
    initialize: () => () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
    user: null,
    isConnected: false,
    loading: true,

    signInWithGoogle: async () => {
        const supabase = createClient();
        set({ loading: true });

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                // Request offline access so Supabase returns a provider_refresh_token
                queryParams: {
                    access_type: "offline",
                    prompt: "consent",
                },
                // Calendar + Gmail scopes so existing API routes work after token extraction
                scopes: [
                    "https://www.googleapis.com/auth/calendar",
                    "https://www.googleapis.com/auth/gmail.readonly",
                    "https://www.googleapis.com/auth/userinfo.email",
                    "https://www.googleapis.com/auth/userinfo.profile",
                ].join(" "),
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            console.error("[Auth] Google sign-in error:", error.message);
            set({ loading: false });
        }
        // On success Supabase redirects to /auth/callback — loading stays true
        // until onAuthStateChange fires after redirect completes.
    },

    signOut: async () => {
        const supabase = createClient();
        set({ loading: true });

        // Sign out of Supabase (invalidates Supabase session)
        await supabase.auth.signOut();

        // Clear the legacy Google HTTPOnly cookies
        await fetch("/api/auth/google/logout", { method: "POST" }).catch(() => null);

        set({ user: null, isConnected: false, loading: false });
    },

    initialize: () => {
        const supabase = createClient();

        // Get initial session (hydrates store on page load / hot reload)
        supabase.auth.getUser().then(({ data }) => {
            set({
                user: data.user ?? null,
                isConnected: !!data.user,
                loading: false,
            });
        });

        // Listen for ongoing auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                set({
                    user: session?.user ?? null,
                    isConnected: !!session?.user,
                    loading: false,
                });
            }
        );

        // Return cleanup function for useEffect
        return () => subscription.unsubscribe();
    },
}));
