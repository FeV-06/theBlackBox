"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { WidgetInstance } from "@/types/widgetInstance";
import { registryMap } from "@/lib/widgetRegistry";

interface StackExpandModalProps {
    isOpen: boolean;
    groupId: string | null;
    instances: WidgetInstance[];
    activeId: string;
    onSelect: (instanceId: string) => void;
    onClose: () => void;
}

export default function StackExpandModal({
    isOpen,
    groupId,
    instances,
    activeId,
    onSelect,
    onClose,
}: StackExpandModalProps) {
    // Escape key support
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleEsc);
        }
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 flex items-center justify-center p-4 md:p-8"
                    style={{ zIndex: 999999 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={onClose}
                    />

                    {/* Modal Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 20 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="relative w-full max-w-[900px] max-h-[80vh] flex flex-col bg-[#0c0c11]/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                            <div>
                                <h3 className="text-lg font-bold text-white tracking-tight">Stack Widgets</h3>
                                <p className="text-xs text-white/40">Click to select the active widget for this stack</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-white/10 text-white/60 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content Grid */}
                        <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {instances.map((inst) => {
                                    const def = registryMap.get(inst.type);
                                    const Icon = def?.icon || X;
                                    const isActive = inst.instanceId === activeId;

                                    return (
                                        <motion.button
                                            key={inst.instanceId}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => onSelect(inst.instanceId)}
                                            className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-300 text-left ${isActive
                                                ? "bg-purple-500/10 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/30"
                                                : "bg-white/[0.03] border-white/5 hover:border-white/20 hover:bg-white/[0.05]"
                                                }`}
                                        >
                                            <div className={`p-2 rounded-lg ${isActive ? "bg-purple-500/20 text-purple-300" : "bg-white/5 text-white/40"
                                                }`}>
                                                <Icon size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="font-bold text-sm text-white truncate uppercase tracking-tight">
                                                        {inst.title || def?.defaultTitle || inst.type}
                                                    </span>
                                                    {isActive && (
                                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-500 text-white uppercase tracking-widest">
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">
                                                    {inst.type.replace("_", " ")}
                                                </p>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
