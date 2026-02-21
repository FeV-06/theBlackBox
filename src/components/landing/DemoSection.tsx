"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function DemoSection() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return (
        <section className="w-full py-24 px-6 bg-background text-foreground overflow-hidden">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">

                {/* Left Content */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
                        See it in action.
                    </h2>

                    <p className="mt-6 text-muted-foreground text-lg leading-relaxed">
                        Your dashboard, fully customizable. Drag, resize, and build a layout that works for you.
                    </p>

                    <p className="mt-4 text-muted-foreground">
                        No clutter. No switching. Just your system.
                    </p>

                    <button
                        onClick={() => window.location.href = '/dashboard'}
                        className="mt-8 px-7 py-3.5 rounded-xl border border-border bg-card/40 hover:bg-accent hover:text-background transition-colors duration-300 font-medium"
                    >
                        Launch dashboard
                    </button>
                </motion.div>

                {/* Right: Live Preview */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="relative group h-[500px]"
                >
                    <div className="relative h-full w-full rounded-2xl border border-border bg-card/40 overflow-hidden">
                        {/* Scale container for iframe to see more of the canvas */}
                        <div className="absolute top-0 left-0 w-[133.33%] h-[133.33%] origin-top-left scale-[0.75]">
                            <iframe
                                src="/demo"
                                className="w-full h-full border-none pointer-events-auto bg-transparent"
                                title="Interactive Dashboard Demo"
                            />
                        </div>
                    </div>

                    {/* Caption for the "Live" feel */}
                    <div className="absolute -bottom-6 right-4 flex items-center gap-2 text-xs font-mono text-primary/60">
                        <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                        LIVE PREVIEW
                    </div>
                </motion.div>

            </div>
        </section>
    );
}
