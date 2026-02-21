"use client";

import { motion } from "framer-motion";
import { Timer, BarChart3, Kanban, LayoutGrid } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";

const features = [
    {
        icon: Timer,
        title: "Focus Timer",
        description:
            "Pomodoro-powered deep work sessions with live stats and streak tracking.",
    },
    {
        icon: BarChart3,
        title: "Smart Insights",
        description:
            "See your productivity score, peak hours, and weekly trends — all automatically.",
    },
    {
        icon: Kanban,
        title: "Project Kanban",
        description:
            "Drag-and-drop boards with subtasks, streaks, and view modes for every project.",
    },
    {
        icon: LayoutGrid,
        title: "Widget Canvas",
        description:
            "Free-form dashboard you design yourself — resize, stack, and lock widgets anywhere.",
    },
];

const cardVariants = {
    hidden: { opacity: 0, y: 32 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, delay: i * 0.12 },
    }),
};

export default function Features() {
    return (
        <section
            id="features"
            className="relative w-full bg-background py-28 px-6 md:px-12"
        >
            {/* Section heading */}
            <div className="max-w-4xl mx-auto text-center mb-16">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.5 }}
                    className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground"
                >
                    Everything in one place
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mt-4 text-muted-foreground text-base md:text-lg max-w-xl mx-auto"
                >
                    Widgets, timers, insights, and projects — assembled the way you
                    work.
                </motion.p>
            </div>

            {/* Cards */}
            <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
                {features.map((feat, i) => (
                    <motion.div
                        key={feat.title}
                        custom={i}
                        variants={cardVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.3 }}
                        className="relative h-full rounded-2xl border border-border p-2 md:p-3"
                    >
                        <GlowingEffect
                            spread={40}
                            glow={true}
                            disabled={false}
                            proximity={64}
                            inactiveZone={0.01}
                            borderWidth={2}
                        />
                        <div className="group relative z-10 flex h-full flex-col p-6 overflow-hidden rounded-xl border border-border bg-card/40 backdrop-blur-sm hover:bg-accent transition-all duration-300">
                            {/* Icon */}
                            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-border text-primary group-hover:text-background transition-colors">
                                <feat.icon size={22} strokeWidth={1.8} />
                            </div>

                            {/* Copy */}
                            <h3 className="text-lg font-semibold text-foreground group-hover:text-background mb-2 tracking-tight transition-colors">
                                {feat.title}
                            </h3>
                            <p className="text-sm leading-relaxed text-muted-foreground group-hover:text-background/80 transition-colors">
                                {feat.description}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
