"use client";

import { create } from "zustand";

interface GoogleProfile {
    name: string;
    email: string;
    picture: string;
}

interface GoogleAuthState {
    isConnected: boolean;
    profile: GoogleProfile | null;
    loading: boolean;

    /** Open popup to start OAuth flow, then check status */
    connectWithPopup: () => void;
    /** Call logout API then clear state */
    disconnect: () => Promise<void>;
    /** Check connection status via /api/auth/google/status */
    checkConnection: () => Promise<void>;
}

// ⚠️ SECURITY: This store holds NO tokens.
// Access/refresh tokens live in HttpOnly cookies managed by server routes.

export const useGoogleAuthStore = create<GoogleAuthState>()((set) => ({
    isConnected: false,
    profile: null,
    loading: false,

    connectWithPopup: () => {
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        const popup = window.open(
            "/api/auth/google",
            "google-oauth",
            `width=${width},height=${height},left=${left},top=${top},popup=1`
        );

        // Listen for success message from callback page
        const handler = async (event: MessageEvent) => {
            if (event.data?.type === "tbb-google-auth" && event.data?.success) {
                window.removeEventListener("message", handler);
                popup?.close();
                // Fetch status (profile info) from server
                set({ loading: true });
                try {
                    const res = await fetch("/api/auth/google/status");
                    const data = await res.json();
                    if (data.connected) {
                        set({
                            isConnected: true,
                            profile: data.profile,
                            loading: false,
                        });
                    } else {
                        set({ loading: false });
                    }
                } catch {
                    set({ loading: false });
                }
            }
        };
        window.addEventListener("message", handler);

        // Fallback: poll if popup closes without postMessage
        const interval = setInterval(async () => {
            if (popup && popup.closed) {
                clearInterval(interval);
                window.removeEventListener("message", handler);
                // Check status in case cookies were set
                set({ loading: true });
                try {
                    const res = await fetch("/api/auth/google/status");
                    const data = await res.json();
                    set({
                        isConnected: data.connected ?? false,
                        profile: data.profile ?? null,
                        loading: false,
                    });
                } catch {
                    set({ loading: false });
                }
            }
        }, 1000);
    },

    disconnect: async () => {
        try {
            await fetch("/api/auth/google/logout", { method: "POST" });
        } catch {
            // Cookie clearing might fail, reset state anyway
        }
        set({ isConnected: false, profile: null });
    },

    checkConnection: async () => {
        set({ loading: true });
        try {
            const res = await fetch("/api/auth/google/status");
            const data = await res.json();
            set({
                isConnected: data.connected ?? false,
                profile: data.profile ?? null,
                loading: false,
            });
        } catch {
            set({ isConnected: false, profile: null, loading: false });
        }
    },
}));
