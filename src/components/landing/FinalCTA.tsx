"use client";

import { motion } from "framer-motion";

export default function FinalCTA() {
    return (
        <section className="w-full py-28 px-6 bg-background text-foreground relative overflow-hidden group">
            {/* Subtle background glow effect using terminal theme primary color, increases on section hover */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center transition-opacity duration-700 opacity-60 group-hover:opacity-100">
                <div className="w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full" />
            </div>

            <div className="max-w-3xl mx-auto text-center relative z-10 p-12 rounded-3xl transition-all duration-500 shadow-[0_0_40px_rgba(var(--color-primary-rgb),0.05)] group-hover:shadow-[0_0_80px_rgba(var(--color-primary-rgb),0.15)] bg-card/20 backdrop-blur-[2px] border border-border/50">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-primary/90 drop-shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.25)]">
                        Your system. Your rules.
                    </h2>

                    <p className="mt-6 text-muted-foreground text-lg leading-relaxed">
                        Everything you need, exactly where you want it. Start your day with clarity.
                    </p>

                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => window.location.href = '/api/auth/google'}
                            className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-primary/70 text-primary-foreground font-medium hover:scale-[1.04] active:scale-[0.98] hover:shadow-[0_0_30px_rgba(var(--color-primary-rgb),0.4)] transition-all duration-300"
                        >
                            Get started
                        </button>

                        <button
                            onClick={() => window.location.href = '/dashboard'}
                            className="px-8 py-4 rounded-xl border border-border bg-card/40 backdrop-blur-sm hover:bg-accent hover:text-background hover:-translate-y-1 transition-all duration-300 font-medium"
                        >
                            View demo
                        </button>
                    </div>

                    <p className="mt-8 text-sm text-muted-foreground/80 font-medium animate-pulse">
                        Set up your dashboard in under 30 seconds
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
