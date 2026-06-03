import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  CloudDrizzle,
  Loader2,
  MapPin,
} from "lucide-react";

interface WeatherData {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
}

const CITY = { name: "London", lat: 51.5074, lon: -0.1278 };

function getWeatherIcon(code: number, size = 28) {
  // WMO Weather interpretation codes (WW)
  if (code === 0) return <Sun size={size} className="text-warning" />;
  if (code >= 1 && code <= 3) return <Cloud size={size} className="text-muted-foreground" />;
  if (code === 45 || code === 48) return <CloudFog size={size} className="text-muted-foreground" />;
  if (code >= 51 && code <= 57) return <CloudDrizzle size={size} className="text-primary" />;
  if (code >= 61 && code <= 67) return <CloudRain size={size} className="text-primary" />;
  if (code >= 71 && code <= 77) return <CloudSnow size={size} className="text-primary" />;
  if (code >= 80 && code <= 82) return <CloudRain size={size} className="text-primary" />;
  if (code >= 85 && code <= 86) return <CloudSnow size={size} className="text-primary" />;
  if (code >= 95) return <CloudLightning size={size} className="text-warning" />;
  return <Sun size={size} className="text-warning" />;
}

function getWeatherLabel(code: number): string {
  const labels: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };
  return labels[code] ?? "Unknown";
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchWeather() {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${CITY.lat}&longitude=${CITY.lon}&current_weather=true`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Weather API error");
        const data = await res.json();
        if (!data.current_weather) throw new Error("Missing weather data");
        if (!cancelled) {
          setWeather({
            temperature: data.current_weather.temperature,
            weatherCode: data.current_weather.weathercode,
            windSpeed: data.current_weather.windspeed,
          });
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchWeather();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Card className="p-4 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-sm">Loading weather…</span>
        </div>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className="p-4 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="size-4" />
          <span className="text-sm">Weather unavailable</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-4">
        {getWeatherIcon(weather.weatherCode)}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-semibold tracking-tight">
              {Math.round(weather.temperature)}°C
            </span>
            <span className="text-sm text-muted-foreground">{getWeatherLabel(weather.weatherCode)}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <MapPin className="size-3" />
            {CITY.name}
            <span className="mx-1">·</span>
            Wind {Math.round(weather.windSpeed)} km/h
          </div>
        </div>
      </div>
    </Card>
  );
}
