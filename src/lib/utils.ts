export const FALLBACK_QUOTES = {
    motivational: [
        "The only way to do great work is to love what you do. — Steve Jobs",
        "Success is not final, failure is not fatal: it is the courage to continue that counts. — Winston Churchill",
        "Believe you can and you're halfway there. — Theodore Roosevelt",
        "It does not matter how slowly you go as long as you do not stop. — Confucius",
        "The future belongs to those who believe in the beauty of their dreams. — Eleanor Roosevelt",
        "Don't watch the clock; do what it does. Keep going. — Sam Levenson",
        "Everything you've ever wanted is on the other side of fear. — George Addair",
        "You are never too old to set another goal or to dream a new dream. — C.S. Lewis",
    ],
    anime: [
        "If you don't take risks, you can't create a future. — Monkey D. Luffy",
        "The world isn't perfect. But it's there for us, doing the best it can. — Roy Mustang",
        "People's lives don't end when they die. It ends when they lose faith. — Itachi Uchiha",
        "Giving up kills people. When people reject giving up... they finally win. — Levi Ackerman",
        "A lesson without pain is meaningless. — Edward Elric",
        "It's not the face that makes someone a monster; it's the choices they make. — Naruto Uzumaki",
        "The moment you think of giving up, think of the reason why you held on so long. — Natsu Dragneel",
        "Power comes in response to a need, not a desire. — Goku",
    ],
    tech: [
        "First, solve the problem. Then, write the code. — John Johnson",
        "Code is like humor. When you have to explain it, it's bad. — Cory House",
        "Simplicity is the soul of efficiency. — Austin Freeman",
        "Make it work, make it right, make it fast. — Kent Beck",
        "Any fool can write code that a computer can understand. Good programmers write code that humans can understand. — Martin Fowler",
        "Programming isn't about what you know; it's about what you can figure out. — Chris Pine",
        "The best error message is the one that never shows up. — Thomas Fuchs",
        "Talk is cheap. Show me the code. — Linus Torvalds",
    ],
    random: [
        "We are what we repeatedly do. Excellence is not an act, but a habit. — Aristotle",
        "In the middle of difficulty lies opportunity. — Albert Einstein",
        "Life is what happens when you're busy making other plans. — John Lennon",
        "The only limit to our realization of tomorrow is our doubts of today. — Franklin D. Roosevelt",
        "Stay hungry, stay foolish. — Steve Jobs",
        "Not all those who wander are lost. — J.R.R. Tolkien",
        "The best time to plant a tree was 20 years ago. The second best time is now. — Chinese Proverb",
        "Do what you can, with what you have, where you are. — Theodore Roosevelt",
    ],
};

export function getRandomQuote(vibe: keyof typeof FALLBACK_QUOTES): string {
    const quotes = FALLBACK_QUOTES[vibe];
    return quotes[Math.floor(Math.random() * quotes.length)];
}

export async function fetchQuote(vibe: keyof typeof FALLBACK_QUOTES): Promise<string> {
    try {
        const res = await fetch("https://api.quotable.io/random", {
            signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        return `${data.content} — ${data.author}`;
    } catch {
        return getRandomQuote(vibe);
    }
}

export function getTodayStr(): string {
    return new Date().toISOString().slice(0, 10);
}

export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function getWeekDays(): string[] {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
    }
    return days;
}

export function getDayLabel(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short" });
}
