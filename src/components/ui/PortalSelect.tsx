"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import { useWidgetStore } from "@/store/useWidgetStore";
import { AnimatePresence, motion } from "framer-motion";

interface Option {
    label: string;
    value: string;
}

interface PortalSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    className?: string;
    style?: React.CSSProperties;
    placeholder?: string;
}

export function PortalSelect({
    value,
    onChange,
    options,
    className = "",
    style = {},
    placeholder = "Select...",
}: PortalSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
                // Check if click is inside the dropdown (which is in a portal)
                const dropdown = document.getElementById("portal-select-dropdown");
                if (dropdown && !dropdown.contains(e.target as Node)) {
                    setIsOpen(false);
                }
            }
        };
        if (isOpen) {
            window.addEventListener("mousedown", handleClickOutside);
            window.addEventListener("resize", () => setIsOpen(false)); // Close on resize to avoid misalignment
            window.addEventListener("scroll", () => setIsOpen(false), true); // Close on scroll
        }
        return () => {
            window.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("resize", () => setIsOpen(false));
            window.removeEventListener("scroll", () => setIsOpen(false), true);
        };
    }, [isOpen]);

    const handleOpen = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + 4,
                left: rect.left,
                width: Math.max(rect.width, 120), // Minimum width for the menu
            });
            setIsOpen(!isOpen);
        }
    };

    const selectedLabel = options.find((o) => o.value === value)?.label || placeholder;

    return (
        <>
            <button
                ref={triggerRef}
                onClick={handleOpen}
                className={`flex items-center justify-between gap-2 px-2 py-1 rounded-lg border text-[11px] outline-none transition-colors ${className}`}
                style={{
                    background: "rgba(255,255,255,0.03)",
                    borderColor: isOpen ? "var(--color-accent)" : "rgba(255,255,255,0.06)",
                    color: "var(--color-text-secondary)",
                    ...style,
                }}
            >
                <span className="truncate">{selectedLabel}</span>
                <ChevronDown size={11} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen &&
                createPortal(
                    <div
                        id="portal-select-dropdown"
                        className="fixed z-[999999] flex flex-col rounded-xl overflow-hidden shadow-2xl border"
                        style={{
                            top: position.top,
                            left: position.left,
                            minWidth: position.width,
                            background: "#121216", // Hardcoded dark bg for safety
                            borderColor: "rgba(255,255,255,0.08)",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
                            backdropFilter: "blur(12px)",
                        }}
                    >
                        <div className="flex flex-col max-h-[240px] overflow-y-auto p-1 custom-scrollbar">
                            {options.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                    }}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-left transition-colors hover:bg-white/5"
                                    style={{
                                        color: opt.value === value ? "var(--color-accent)" : "var(--color-text-secondary)",
                                        background: opt.value === value ? "rgba(124,92,255,0.1)" : "transparent",
                                    }}
                                >
                                    <span className="flex-1 truncate">{opt.label}</span>
                                    {opt.value === value && <Check size={10} />}
                                </button>
                            ))}
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
}
