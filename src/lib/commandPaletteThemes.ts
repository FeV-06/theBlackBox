import { CommandPaletteTheme } from "@/types/commandPalette";

export const COMMAND_PALETTE_THEMES: Record<CommandPaletteTheme, {
    container: string;
    input: string;
    item: string;
    showIcons: boolean;
    density: string;
}> = {
    default: {
        container: "bg-black/40 backdrop-blur-xl border border-white/10",
        input: "text-white",
        item: "hover:bg-white/10",
        showIcons: true,
        density: "comfortable",
    },

    terminal: {
        container: "bg-black border border-green-500/30 font-mono",
        input: "text-green-400",
        item: "hover:bg-green-500/10 text-green-400",
        showIcons: false,
        density: "compact",
    },

    creative: {
        container: "bg-white/5 backdrop-blur-2xl rounded-3xl",
        input: "text-white",
        item: "hover:bg-white/10 rounded-xl",
        showIcons: true,
        density: "comfortable",
    },

    ai: {
        container:
            "bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-purple-500/20",
        input: "text-white",
        item: "hover:bg-purple-500/10",
        showIcons: true,
        density: "comfortable",
    },

    focus: {
        container: "bg-black/90 border border-white/5",
        input: "text-white/80",
        item: "hover:bg-white/5",
        showIcons: false,
        density: "compact",
    },
    mocha: {
        container: "bg-[#2d2621]/90 border border-[#c0a080]/30 font-serif",
        input: "text-[#ece5d8]",
        item: "hover:bg-[#c0a080]/10 text-[#ece5d8]",
        showIcons: true,
        density: "comfortable",
    },
};
