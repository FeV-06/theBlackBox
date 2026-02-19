"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";

interface PortalMenuProps {
    trigger: ReactNode;
    children: ReactNode;
    align?: "left" | "right";
    className?: string;
}

export function PortalMenu({
    trigger,
    children,
    align = "right",
    className = "",
}: PortalMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
                const menu = document.getElementById("portal-menu-dropdown");
                if (menu && !menu.contains(e.target as Node)) {
                    setIsOpen(false);
                }
            }
        };
        if (isOpen) {
            window.addEventListener("mousedown", handleClickOutside);
            window.addEventListener("resize", () => setIsOpen(false));
            window.addEventListener("scroll", () => setIsOpen(false), true);
        }
        return () => {
            window.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("resize", () => setIsOpen(false));
            window.removeEventListener("scroll", () => setIsOpen(false), true);
        };
    }, [isOpen]);

    const handleOpen = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY + 8,
                left: align === "right" ? rect.right + window.scrollX : rect.left + window.scrollX,
            });
            setIsOpen(!isOpen);
        }
    };

    return (
        <div className="relative inline-block" ref={triggerRef}>
            <div onClick={handleOpen} className="cursor-pointer">
                {trigger}
            </div>

            {isOpen &&
                createPortal(
                    <div
                        id="portal-menu-dropdown"
                        className={`fixed z-[999999] rounded-xl py-1 overflow-hidden shadow-2xl border ${className}`}
                        style={{
                            top: position.top,
                            left: position.left,
                            transform: align === "right" ? "translateX(-100%)" : "none",
                            background: "rgba(20,20,26,0.98)",
                            borderColor: "rgba(255,255,255,0.08)",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                            backdropFilter: "blur(16px)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close menu when any child (usually a button) is clicked */}
                        <div onClick={() => setIsOpen(false)}>
                            {children}
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
}
