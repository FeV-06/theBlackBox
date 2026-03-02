import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    // Load app shell from cache first so it works instantly offline.
    // Widgets that need the network (Weather, Gmail, GitHub) will show
    // their own error/loading states gracefully; local-state widgets
    // (Todo, Projects, Focus, Kanban) keep working because Zustand
    // is persisted to localStorage and never touches the network.
    cacheOnFrontEndNav: true,
    aggressiveFrontEndNavCaching: true,
    fallbacks: {
        // Any failed page navigation → show the offline page
        document: "/_offline.html",
    },
    workboxOptions: {
        // The generated service worker already pre-caches all Next.js
        // static chunks. The route overrides below change strategy for
        // page documents only — static assets stay CacheFirst by default.
        runtimeCaching: [
            // ── App pages: serve from cache immediately (no network wait) ──
            {
                urlPattern: /^https?:\/\/[^/]+\/(dashboard|demo)(\/.*)?$/,
                handler: "CacheFirst" as const,
                options: {
                    cacheName: "pages-cache",
                    expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
                },
            },
            // ── Google Fonts (unchanged from default, kept for completeness) ──
            {
                urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
                handler: "CacheFirst" as const,
                options: {
                    cacheName: "google-fonts-webfonts",
                    expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 },
                },
            },
            // ── Google APIs: try network, return empty JSON stub on failure ──
            // This prevents the 10-second timeout hang that made widget
            // interactions feel completely broken while offline.
            {
                urlPattern: /\/api\/google\/.*/,
                handler: (async ({ event }: { event: any }): Promise<Response> => {
                    try {
                        return await fetch(event.request);
                    } catch {
                        return new Response(
                            JSON.stringify({ offline: true, error: "Offline — data unavailable" }),
                            { status: 503, headers: { "Content-Type": "application/json" } }
                        );
                    }
                }) as any,
            },
        ],
    },
});

const nextConfig: NextConfig = {
    reactStrictMode: true,
    // Add empty turbopack config to silence the Next 16 webpack mismatch error 
    // because next-pwa adds a webpack config but we disable it in dev anyway.
    // @ts-ignore - Next 16 property might not be in the current localized types 
    turbopack: {},
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "Cross-Origin-Opener-Policy",
                        value: "same-origin-allow-popups",
                    },
                    {
                        key: "Cross-Origin-Embedder-Policy",
                        value: "unsafe-none",
                    },
                ],
            },
        ];
    },
};

export default withPWA(nextConfig);
