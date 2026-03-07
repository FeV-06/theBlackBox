"use client";

/**
 * Default skeleton shown while a widget's lazy component is loading.
 * Manifests can override this by providing their own `skeleton` property.
 */
export function DefaultWidgetSkeleton() {
    return (
        <div
            aria-busy="true"
            aria-label="Loading widget…"
            style={{
                width: "100%",
                height: "100%",
                minHeight: "80px",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                padding: "1rem",
                overflow: "hidden",
            }}
        >
            {/* Shimmer lines */}
            {[0.75, 0.55, 0.65].map((opacity, i) => (
                <div
                    key={i}
                    style={{
                        height: "10px",
                        borderRadius: "4px",
                        background: "var(--color-surface-2, rgba(255,255,255,0.08))",
                        width: `${60 + i * 15}%`,
                        opacity,
                        animation: "skeleton-pulse 1.6s ease-in-out infinite",
                        animationDelay: `${i * 0.15}s`,
                    }}
                />
            ))}
            <style>{`
                @keyframes skeleton-pulse {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 0.9; }
                }
            `}</style>
        </div>
    );
}
