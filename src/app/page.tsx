import type { Metadata } from "next";
import LandingPage from "@/components/landing/LandingPage";

export const metadata: Metadata = {
    title: "TheBlackBox — Your Productivity Dashboard",
    description:
        "A customizable dashboard where everything you need lives in one place. Focus timer, smart insights, project kanban, and a widget canvas you design yourself.",
};

export default function Home() {
    return <LandingPage />;
}
