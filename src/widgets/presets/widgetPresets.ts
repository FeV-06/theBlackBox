export interface WidgetPreset {
    id: string;
    name: string;
    template: string;
    version: number;
    description: string;
    config: Record<string, any>;
}

export const widgetPresets: WidgetPreset[] = [
    {
        id: "github-stars",
        name: "GitHub Stars",
        template: "api-widget",
        version: 1,
        description: "Track stargazers for any GitHub repository.",
        config: {
            title: "GitHub Stars",
            icon: "star",
            url: "https://api.github.com/repos/vercel/next.js",
            field: "stargazers_count",
            prefix: "⭐ ",
            display: "badge",
            refresh: 3600,
            refreshMode: "interval",
            accentColor: "#eab308"
        }
    },
    {
        id: "bitcoin-price",
        name: "Bitcoin Price",
        template: "api-widget",
        version: 1,
        description: "Real-time Bitcoin price from CoinGecko.",
        config: {
            title: "Bitcoin (USD)",
            icon: "trending-up",
            url: "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
            field: "bitcoin.usd",
            prefix: "$",
            decimals: 2,
            display: "text",
            refresh: 60,
            refreshMode: "interval",
            accentColor: "#f59e0b"
        }
    },
    {
        id: "daily-pushups",
        name: "Pushup Tracker",
        template: "counter-widget",
        version: 1,
        description: "Daily goal tracking for your exercises.",
        config: {
            title: "Daily Pushups",
            icon: "activity",
            goal: 50,
            min: 0,
            max: 1000,
            resetInterval: "daily",
            accentColor: "#3b82f6"
        }
    },
    {
        id: "quick-notes",
        name: "Quick Notes",
        template: "text-widget",
        version: 1,
        description: "A simple markdown scratchpad for your thoughts.",
        config: {
            title: "Brain Dump",
            icon: "none",
            editable: true,
            format: "markdown",
            content: "### Today's Focus\n- [ ] Task 1\n- [ ] Task 2",
            accentColor: "#10b981"
        }
    },
    {
        id: "world-clock-london",
        name: "London Clock",
        template: "api-widget",
        version: 1,
        description: "Live time from London (WorldTimeAPI).",
        config: {
            title: "London Time",
            icon: "clock",
            url: "https://worldtimeapi.org/api/timezone/Europe/London",
            field: "datetime",
            display: "text",
            refresh: 30,
            refreshMode: "interval",
            accentColor: "#22d3ee"
        }
    },
    {
        id: "weather-paris",
        name: "Paris Weather",
        template: "api-widget",
        version: 1,
        description: "Current temperature in Paris via wttr.in.",
        config: {
            title: "Paris Forecast",
            icon: "cloud",
            url: "https://wttr.in/Paris?format=j1",
            field: "current_condition.0.temp_C",
            suffix: "°C",
            display: "badge",
            refresh: 1800,
            refreshMode: "interval",
            accentColor: "#06b6d4"
        }
    }
];
