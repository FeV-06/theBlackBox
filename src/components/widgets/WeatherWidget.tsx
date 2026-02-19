"use client";

import { useState, useCallback } from "react";
import {
    CloudSun,
    Thermometer,
    Wind,
    Droplets,
    Search,
    Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import type { WidgetInstance } from "@/types/widgetInstance";

interface WeatherData {
    temperature: number;
    windspeed: number;
    humidity: number;
    weathercode: number;
}

const WMO_CODES: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Slight showers",
    81: "Moderate showers",
    82: "Violent showers",
    95: "Thunderstorm",
    96: "Thunderstorm w/ hail",
    99: "Thunderstorm w/ heavy hail",
};

export default function WeatherWidget({ instance }: { instance: WidgetInstance }) {
    const [city, setCity] = useState("");
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [cityName, setCityName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchWeather = useCallback(async () => {
        if (!city.trim()) return;
        setLoading(true);
        setError("");
        try {
            // Geocode city
            const geoRes = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
            );
            const geoData = await geoRes.json();
            if (!geoData.results?.length) throw new Error("City not found");

            const { latitude, longitude, name } = geoData.results[0];
            setCityName(name);

            // Get weather
            const weatherRes = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relative_humidity_2m`
            );
            const weatherData = await weatherRes.json();
            const cw = weatherData.current_weather;
            const humidity = weatherData.hourly?.relative_humidity_2m?.[0] ?? 0;

            setWeather({
                temperature: cw.temperature,
                windspeed: cw.windspeed,
                humidity,
                weathercode: cw.weathercode,
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to fetch");
        } finally {
            setLoading(false);
        }
    }, [city]);

    return (
        <div className="flex flex-col gap-3">
            {/* City input */}
            <div className="flex gap-2">
                <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchWeather()}
                    placeholder="Enter city..."
                    className="flex-1 bg-white/[0.03] border border-[color:var(--color-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[color:var(--color-accent)] transition-colors"
                    style={{ color: "var(--color-text-primary)" }}
                />
                <button onClick={fetchWeather} className="btn-accent px-3 py-2" disabled={loading}>
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                </button>
            </div>

            {error && <p className="text-xs" style={{ color: "var(--color-danger)" }}>{error}</p>}

            {weather && (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{cityName}</p>
                            <p className="text-3xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                                {Math.round(weather.temperature)}°C
                            </p>
                        </div>
                        <CloudSun size={36} style={{ color: "var(--color-accent)" }} />
                    </div>
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        {WMO_CODES[weather.weathercode] || "Unknown"}
                    </p>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                            <Wind size={12} /> {weather.windspeed} km/h
                        </div>
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                            <Droplets size={12} /> {weather.humidity}%
                        </div>
                    </div>
                </div>
            )}

            {!weather && !loading && !error && (
                <p className="text-xs text-center py-4" style={{ color: "var(--color-text-muted)" }}>
                    Search for a city to see weather
                </p>
            )}

            {loading && !weather && (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <Skeleton width="100px" height="14px" className="mb-2" />
                            <Skeleton width="80px" height="36px" rounded="8px" />
                        </div>
                        <Skeleton width="36px" height="36px" rounded="50%" />
                    </div>
                    <Skeleton width="60%" height="14px" />
                    <div className="flex gap-4">
                        <Skeleton width="60px" height="12px" />
                        <Skeleton width="60px" height="12px" />
                    </div>
                </div>
            )}
        </div>
    );
}
