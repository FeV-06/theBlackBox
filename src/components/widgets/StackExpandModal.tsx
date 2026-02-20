"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { WidgetInstance } from "@/types/widgetInstance";
import { registryMap } from "@/lib/widgetRegistry";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

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
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[900px] bg-[#0c0c11]/95 border-white/10 backdrop-blur-2xl p-0">
                <DialogHeader className="px-6 pt-6 pb-0">
                    <DialogTitle className="text-lg font-bold text-white tracking-tight">
                        Stack Widgets
                    </DialogTitle>
                    <DialogDescription className="text-xs text-white/40">
                        Click to select the active widget for this stack
                    </DialogDescription>
                </DialogHeader>

                {/* Content Grid */}
                <div className="overflow-y-auto px-6 pb-6 max-h-[60vh] custom-scrollbar">
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
            </DialogContent>
        </Dialog>
    );
}
