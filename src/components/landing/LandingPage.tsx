"use client";

import Hero from "./Hero";
import Features from "./Features";
import Footer from "./Footer";
import ProblemSolution from "./ProblemSolution";
import HowItWorks from "./HowItWorks";
import DemoSection from "./DemoSection";
import FinalCTA from "./FinalCTA";

export default function LandingPage() {
    return (
        <main className="bg-background min-h-screen">
            <Hero />
            <ProblemSolution />
            <HowItWorks />
            <DemoSection />
            <Features />
            <FinalCTA />
            <Footer />
        </main>
    );
}
