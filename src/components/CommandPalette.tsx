"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, LayoutGrid, Layers, ChevronDown, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWidgetStore } from "@/store/useWidgetStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useNavigationStore } from "@/store/useNavigationStore";
import { getCommands, Command } from "@/lib/commandPaletteCommands";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ─── Global State for Palette Visibility ─── */
export type CommandHistory = {
    id: string;
    title: string;
};

interface CommandPaletteState {
    isOpen: boolean;
    recent: CommandHistory[];
    open: () => void;
    close: () => void;
    toggle: () => void;
    addRecent: (cmd: CommandHistory) => void;
}

const MAX_RECENTS = 6;

export const useCommandPalette = create<CommandPaletteState>()(
    persist(
        (set, get) => ({
            isOpen: false,
            recent: [],
            open: () => set({ isOpen: true }),
            close: () => set({ isOpen: false }),
            toggle: () => set((state) => ({ isOpen: !state.isOpen })),
            addRecent: (cmd) => {
                const prev = get().recent;
                const filtered = prev.filter(c => c.id !== cmd.id);
                const updated = [cmd, ...filtered].slice(0, MAX_RECENTS);
                set({ recent: updated });
            },
        }),
        {
            name: "tbb-command-palette",
            partialize: (state) => ({ recent: state.recent }),
        }
    )
);

/* ─── Component ─── */
export default function CommandPalette() {
    const { isOpen, close, open, recent, addRecent } = useCommandPalette();
    const router = useRouter();
    const widgetStore = useWidgetStore();
    const settingsStore = useSettingsStore();
    const { activeTab, setActiveTab } = useNavigationStore();

    const [search, setSearch] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
    const listRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Get commands
    const allCommands = useMemo(() => getCommands({ router, widgetStore, settingsStore, setActiveTab, currentTab: activeTab, recent }), [router, widgetStore, settingsStore, setActiveTab, activeTab, recent]);

    // Filter commands
    const filteredCommands = useMemo(() => {
        if (!search.trim()) return allCommands;
        const lowerSearch = search.toLowerCase();
        return allCommands.filter(cmd =>
            cmd.title.toLowerCase().includes(lowerSearch) ||
            cmd.subtitle?.toLowerCase().includes(lowerSearch) ||
            cmd.keywords?.some(k => k.toLowerCase().includes(lowerSearch))
        );
    }, [allCommands, search]);

    // Group by section then subGroup
    const groupedCommands = useMemo(() => {
        const groups: Record<string, Record<string, Command[]>> = {};

        filteredCommands.forEach(cmd => {
            if (!groups[cmd.section]) groups[cmd.section] = {};
            const sub = cmd.subGroup || "_default";
            if (!groups[cmd.section][sub]) groups[cmd.section][sub] = [];
            groups[cmd.section][sub].push(cmd);
        });
        return groups;
    }, [filteredCommands]);

    const orderedSections = ["Recent", "Dashboard", "Calendar", "Projects", "Focus", "Settings", "Navigation", "Widgets"];

    // Flatten for keyboard navigation (respecting collapsed state and section order)
    const flatList = useMemo(() => {
        const list: Command[] = [];
        orderedSections.forEach(section => {
            const subGroups = groupedCommands[section];
            if (!subGroups) return;
            Object.entries(subGroups).forEach(([sub, cmds]) => {
                const groupKey = `${section}-${sub}`;
                if (!collapsedGroups[groupKey]) {
                    list.push(...cmds);
                }
            });
        });
        return list;
    }, [groupedCommands, collapsedGroups]);

    // Reset selection on open/search
    useEffect(() => {
        setSelectedIndex(0);
    }, [search, isOpen]);

    // Global Keydown Listener
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                if (isOpen) close(); else open();
            }
            if (e.key === "Escape" && isOpen) {
                close();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen, open, close]);

    // Local Key Navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % flatList.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + flatList.length) % flatList.length);
        } else if (e.key === "Enter") {
            e.preventDefault();
            const cmd = flatList[selectedIndex];
            if (cmd) {
                runCommand(cmd);
            }
        }
    };

    const runCommand = (cmd: Command) => {
        cmd.run();
        // Ignore saving Recents metadata as recent commands, though strip the prefix if it occurs
        if (cmd.section !== "Recent") {
            const cleanId = cmd.id.replace(/^recent-/, "");
            addRecent({
                id: cleanId,
                title: cmd.title
            });
        }
        close();
        setSearch("");
    };

    // Auto-scroll to selected
    useEffect(() => {
        if (!listRef.current) return;
        const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
        if (selectedEl) {
            selectedEl.scrollIntoView({ block: "nearest" });
        }
    }, [selectedIndex]);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={close}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="relative w-full max-w-[560px] max-h-[70vh] flex flex-col rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-[0_0_40px_rgba(124,92,255,0.25)] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={handleKeyDown}
                    >
                        {/* Search Bar */}
                        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
                            <Search className="text-white/50" size={20} />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search commands..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1 bg-transparent text-lg text-white placeholder:text-white/30 outline-none"
                                autoFocus
                            />
                            <div className="flex items-center gap-1">
                                <span className="px-2 py-1 rounded bg-white/10 text-[10px] uppercase font-medium text-white/50 border border-white/5">ESC</span>
                            </div>
                        </div>

                        {/* List */}
                        <div ref={listRef} className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {flatList.length === 0 ? (
                                <div className="py-8 text-center text-white/30">
                                    No commands found.
                                </div>
                            ) : (
                                orderedSections.map((section) => {
                                    const subGroups = groupedCommands[section];
                                    if (!subGroups) return null;
                                    const hasCmds = Object.values(subGroups).some(cmds => cmds.length > 0);
                                    if (!hasCmds) return null;
                                    return (
                                        <div key={section} className="mb-2">
                                            <div className="px-3 py-2 text-xs font-medium text-white/40 uppercase tracking-wider">
                                                {section}
                                            </div>
                                            <div>
                                                {Object.entries(subGroups).map(([sub, cmds]) => {
                                                    if (cmds.length === 0) return null;
                                                    return (
                                                        <div key={sub} className="mb-2">
                                                            {sub !== "_default" && (
                                                                <>
                                                                    <div
                                                                        className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] text-white/40 uppercase font-semibold tracking-wider cursor-pointer hover:text-white/60 transition-colors"
                                                                        onClick={() => {
                                                                            const key = `${section}-${sub}`;
                                                                            setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }));
                                                                        }}
                                                                    >
                                                                        {collapsedGroups[`${section}-${sub}`] ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                                                                        {sub === "Canvas" && <LayoutGrid size={12} />}
                                                                        {sub === "Templates" && <Layers size={12} />}
                                                                        <p className="flex-1">{sub}</p>
                                                                    </div>
                                                                    <div className="border-t border-white/5 my-1 mx-3" />
                                                                </>
                                                            )}
                                                            {!collapsedGroups[`${section}-${sub}`] && cmds.map((cmd) => {
                                                                const isSelected = flatList[selectedIndex]?.id === cmd.id;
                                                                return (
                                                                    <motion.button
                                                                        key={cmd.id}
                                                                        data-index={flatList.indexOf(cmd)}
                                                                        onClick={() => runCommand(cmd)}
                                                                        onMouseEnter={() => setSelectedIndex(flatList.indexOf(cmd))}
                                                                        className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-left transition-all duration-200 ${isSelected
                                                                            ? "bg-white/10 text-white shadow-[0_0_15px_rgba(124,92,255,0.15)]"
                                                                            : "text-white/70 hover:bg-white/5"
                                                                            }`}
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={`p-1.5 rounded-lg ${isSelected ? "text-[#a78bfa]" : "text-white/50"}`}>
                                                                                {cmd.icon}
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-sm font-medium leading-none mb-1">
                                                                                    {cmd.title}
                                                                                </div>
                                                                                {cmd.subtitle && (
                                                                                    <div className="text-xs text-white/40 leading-none">
                                                                                        {cmd.subtitle}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        {isSelected && (
                                                                            <motion.div
                                                                                layoutId="enter-icon"
                                                                                className="text-xs text-white/30 font-medium pr-2"
                                                                            >
                                                                                ↵
                                                                            </motion.div>
                                                                        )}
                                                                    </motion.button>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
