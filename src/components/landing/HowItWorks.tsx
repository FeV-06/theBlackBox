"use client";

import { motion } from "framer-motion";
import { LayoutGrid, Move, Play } from "lucide-react";

const steps = [
    {
        num: "01",
        title: "Add widgets",
        description: "Choose from notes, tasks, weather, and more.",
        icon: LayoutGrid,
        delay: 0.1,
    },
    {
        num: "02",
        title: "Arrange your layout",
        description: "Drag, resize, and organize everything your way.",
        icon: Move,
        delay: 0.2,
    },
    {
        num: "03",
        title: "Start your day",
        description: "Everything you need, ready in one place.",
        icon: Play,
        delay: 0.3,
    },
];

export default function HowItWorks() {
    return (
        <section className="w-full py-24 px-6 bg-background text-foreground overflow-hidden">
            <div className="max-w-6xl mx-auto text-center">

                {/* Heading */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
                        Inside The Black Box
                    </h2>
                    <p className="mt-4 text-muted-foreground text-lg">
                        Set up your perfect dashboard in seconds.
                    </p>
                </motion.div>

                {/* Cards Container */}
                <div className="mt-16 relative">
                    {/* Step Flow Line (Desktop Only) */}
                    <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-border -z-10" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {steps.map((step) => (
                            <motion.div
                                key={step.num}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.8, delay: step.delay, ease: "easeOut" }}
                                className="group p-8 rounded-2xl border border-border bg-card/40 backdrop-blur-md 
                                         hover:bg-accent hover:scale-[1.02] hover:-translate-y-1 
                                         shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.1)] 
                                         hover:shadow-[0_0_35px_rgba(var(--color-primary-rgb),0.25)] 
                                         transition-all duration-300 text-left flex flex-col items-start relative overflow-hidden"
                            >
                                {/* Glow Effect Background */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />

                                {/* Icon Layer (Soft Glow) */}
                                <div className="mb-6 text-primary drop-shadow-[0_0_8px_var(--color-accent-glow)] transition-colors duration-300 group-hover:text-background font-bold">
                                    <step.icon size={28} strokeWidth={2.2} />
                                </div>

                                {/* Step Number (Dimmed Hierarchy) */}
                                <div className="text-4xl font-semibold text-primary/60 mb-2 transition-colors duration-300 group-hover:text-background h-10 leading-none">
                                    {step.num}
                                </div>

                                {/* Content Hierarchy */}
                                <h3 className="mt-4 text-xl font-bold text-primary/90 transition-colors group-hover:text-background">
                                    {step.title}
                                </h3>
                                <p className="mt-2 text-muted-foreground transition-colors group-hover:text-background/80 leading-relaxed">
                                    {step.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
