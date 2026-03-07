"use client";

import { Terminal, Copy, Check, MousePointer2 } from "lucide-react";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface JsonInspectorProps {
    data: any;
    onPathSelect?: (path: string) => void;
}

export function JsonInspector({ data, onPathSelect }: JsonInspectorProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col gap-0 w-full max-h-[500px] rounded-[2rem] bg-[#0A0A0F] border border-white/5 shadow-2xl overflow-hidden animate-fade-in group/inspector">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02] shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Terminal size={16} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Response Inspector</span>
                        <span className="text-[9px] text-white/30 font-medium">Click values to auto-map fields</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCopy}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all cursor-pointer"
                        title="Copy JSON"
                    >
                        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                </div>
            </div>

            {/* Tree Content - Scrolled */}
            <div className="flex-1 overflow-auto p-6 font-mono text-[11px] custom-scrollbar bg-black/20">
                <div className="flex flex-col gap-1.5 break-all">
                    <JsonNode node={data} path="" onSelect={onPathSelect} />
                </div>
            </div>

            {/* Hint Footer */}
            <div className="px-6 py-3 bg-emerald-500/5 border-t border-emerald-500/10 flex items-center gap-2 shrink-0">
                <MousePointer2 size={12} className="text-emerald-400" />
                <span className="text-[9px] text-emerald-400/60 font-bold uppercase tracking-widest">
                    Smart Pick Active: Select any data point
                </span>
            </div>
        </div>
    );
}

function JsonNode({ node, path, onSelect, depth = 0 }: { node: any; path: string; onSelect?: (path: string) => void; depth?: number }) {
    if (node === null) return <span className="text-blue-400">null</span>;
    if (node === undefined) return <span className="text-white/20">undefined</span>;

    const isObject = typeof node === "object" && !Array.isArray(node);
    const isArray = Array.isArray(node);

    if (isObject || isArray) {
        const entries = isObject ? Object.entries(node) : (node as any[]).map((v: any, i: number) => [i, v]);
        const opener = isObject ? "{" : "[";
        const closer = isObject ? "}" : "]";

        if (entries.length === 0) return <span className="text-white/40">{opener}{closer}</span>;

        return (
            <div className="flex flex-col">
                <span className="text-white/40">{opener}</span>
                <div className="flex flex-col border-l border-white/5 ml-4 my-1 pl-4 gap-1.5">
                    {(entries as [any, any][]).map(([key, value], idx: number) => {
                        const currentPath = path ? (isArray ? `${path}[${key}]` : `${path}.${key}`) : String(key);
                        return (
                            <div key={idx} className="flex gap-2 group/node items-baseline">
                                <span className="text-emerald-400/70 whitespace-nowrap shrink-0">{isArray ? "" : `"${key}": `}</span>
                                <JsonNode node={value} path={currentPath} onSelect={onSelect} depth={depth + 1} />
                            </div>
                        );
                    })}
                </div>
                <span className="text-white/40">{closer}</span>
            </div>
        );
    }

    const type = typeof node;
    let colorClass = "text-white/90";
    if (type === "string") colorClass = "text-amber-400/90";
    if (type === "number") colorClass = "text-emerald-400";
    if (type === "boolean") colorClass = "text-purple-400";

    return (
        <button
            onClick={() => onSelect?.(path)}
            className={`
                group/value text-left hover:bg-emerald-500/10 px-1.5 py-0.5 rounded transition-all cursor-pointer ring-1 ring-transparent hover:ring-emerald-500/20 active:scale-95
                ${colorClass} break-all
            `}
        >
            <span className="relative inline-block">
                {type === "string" ? `"${node}"` : String(node)}
                <div className="absolute -right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover/value:opacity-100 transition-opacity">
                    <MousePointer2 size={10} className="text-emerald-400" />
                </div>
            </span>
        </button>
    );
}
