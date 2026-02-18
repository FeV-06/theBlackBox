"use client";

import { WidgetTypeDefinition } from "@/types/widgetInstance";

interface WidgetStackPreviewProps {
    definition: WidgetTypeDefinition;
    title?: string;
}

export default function WidgetStackPreview({
    definition,
    title,
}: WidgetStackPreviewProps) {
    const Icon = definition.icon;
    const displayTitle = title ?? definition.defaultTitle;

    return (
        <div className="flex flex-col h-full bg-black/30 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-xl shadow-[0_0_30px_rgba(124,92,255,0.15)] hover:shadow-[0_0_50px_rgba(124,92,255,0.22)] transition-all duration-300">
            <div className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-3 border-b border-white/[0.04]">
                <div className="p-1 rounded bg-white/5 text-white/40">
                    <Icon size={14} />
                </div>
                <span className="text-[10px] font-bold tracking-tight uppercase opacity-40 truncate">
                    {displayTitle}
                </span>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
                <Icon size={32} className="opacity-[0.03]" />
            </div>
        </div>
    );
}
