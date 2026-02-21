"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import InteractiveNeuralVortex from "@/components/ui/interactive-neural-vortex-background";
import { ParticleTextEffect } from "@/components/ui/interactive-text-particle";

export default function Hero() {
    return (
        <section className="relative h-screen w-full overflow-hidden bg-background text-foreground">
            {/* Background Layer — Interactive WebGL Shader */}
            <div className="absolute inset-0 z-0">
                <InteractiveNeuralVortex />
            </div>

            {/* Overlay Glow */}
            <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] z-10" />

            {/* Content */}
            <div className="relative z-20 flex h-full items-center justify-center px-6">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-4xl w-full text-center border border-border rounded-2xl p-12 md:p-14 backdrop-blur-md bg-card/40 shadow-2xl"
                >
                    {/* Headline */}
                    <div className="w-full h-[60px] md:h-[100px] mb-6 flex items-center justify-center pointer-events-auto">
                        <ParticleTextEffect
                            text="TheBlackBox"
                            particleDensity={2}
                        />
                    </div>

                    {/* Subtext */}
                    <p className="mt-6 text-muted-foreground text-base md:text-xl leading-relaxed max-w-2xl mx-auto">
                        Everything you need—notes, tasks, data, and tools—organized in one customizable space.
                    </p>

                    {/* CTA Buttons */}
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a
                            href="/api/auth/google"
                            className="px-7 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition text-base"
                        >
                            Get Started
                        </a>

                        <button
                            onClick={() =>
                                document
                                    .getElementById("demo")
                                    ?.scrollIntoView({ behavior: "smooth" })
                            }
                            className="px-7 py-3.5 rounded-xl border border-border hover:bg-accent hover:text-background transition-colors duration-300 text-base"
                        >
                            See Demo
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Bottom Fade */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent z-10" />
        </section>
    );
}
