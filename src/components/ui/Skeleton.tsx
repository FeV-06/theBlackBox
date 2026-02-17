"use client";

interface SkeletonProps {
    className?: string;
    /** Width — defaults to full */
    width?: string;
    /** Height — defaults to 16px */
    height?: string;
    /** Border radius — defaults to 8px */
    rounded?: string;
}

/** Rectangular skeleton placeholder with pulse animation */
export function Skeleton({
    className = "",
    width = "100%",
    height = "16px",
    rounded = "8px",
}: SkeletonProps) {
    return (
        <div
            className={`animate-pulse ${className}`}
            style={{
                width,
                height,
                borderRadius: rounded,
                background: "rgba(255,255,255,0.06)",
            }}
        />
    );
}

/** Multiple text-line skeletons that mimic paragraph text */
export function SkeletonLines({
    lines = 3,
    className = "",
}: {
    lines?: number;
    className?: string;
}) {
    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    height="12px"
                    rounded="6px"
                    width={i === lines - 1 ? "60%" : "100%"}
                />
            ))}
        </div>
    );
}

/** Email-row skeleton that matches GmailWidget message row layout */
export function SkeletonEmailRow({ className = "" }: { className?: string }) {
    return (
        <div className={`flex items-start gap-2 px-3 py-2 ${className}`}>
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <Skeleton height="12px" width="70%" rounded="4px" />
                <Skeleton height="10px" width="45%" rounded="4px" />
                <Skeleton height="10px" width="90%" rounded="4px" />
            </div>
            <Skeleton height="10px" width="36px" rounded="4px" className="flex-shrink-0 mt-0.5" />
        </div>
    );
}
