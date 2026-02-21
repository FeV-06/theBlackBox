"use client";

import Link from "next/link";

export default function Footer() {
    return (
        <footer className="w-full bg-background border-t border-border py-10 px-6">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-foreground font-semibold text-sm tracking-tight">
                        TheBlackBox
                    </span>
                    <span className="text-muted-foreground text-xs">
                        — Built with ☕
                    </span>
                </div>

                <div className="flex items-center gap-6 text-muted-foreground text-xs">
                    <Link
                        href="/dashboard"
                        className="hover:text-foreground transition-colors"
                    >
                        Dashboard
                    </Link>
                    <span className="opacity-30">
                        © {new Date().getFullYear()}
                    </span>
                </div>
            </div>
        </footer>
    );
}
