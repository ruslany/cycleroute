'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { CloudOff, CloudSun, RefreshCw, Trash2 } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import DynamicMap from '@/components/map/dynamic-map';
import WeatherForm from '@/components/weather-form';
import { getWeatherDescription } from '@/lib/weather-codes';
import type { WeatherPanelPoint } from '@/lib/weather';
import { useUnits } from '@/components/units-provider';
import {
  formatDistance,
  formatDistanceRound,
  formatSpeed,
  formatTemp,
  tempUnit,
  speedUnit,
  celsiusToFahrenheit,
  kmhToMph,
} from '@/lib/units';

interface WeatherState {
  points: WeatherPanelPoint[];
  startTime: string;
  averageSpeedKmh: number;
}

interface WeatherPageClientProps {
  routeId: string;
  routeName: string;
  distanceMeters: number;
  trackPoints: { latitude: number; longitude: number }[];
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number };
  initialWeatherData: WeatherState | null;
}

const tempConfig: ChartConfig = {
  tempC: { label: 'Temperature', color: 'var(--chart-1)' },
  feelsLikeC: { label: 'Feels Like', color: 'var(--chart-2)' },
  tempDisplay: { label: 'Temperature', color: 'var(--chart-1)' },
  feelsLikeDisplay: { label: 'Feels Like', color: 'var(--chart-2)' },
};

const precipConfig: ChartConfig = {
  precipMm: { label: 'Precipitation (mm)', color: 'var(--chart-3)' },
  precipProbability: { label: 'Precip. Probability (%)', color: 'var(--chart-4)' },
};

const cloudConfig: ChartConfig = {
  cloudCoverPercent: { label: 'Cloud Cover (%)', color: 'var(--chart-5)' },
};

const windConfig: ChartConfig = {
  windSpeedKmh: { label: 'Wind Speed', color: 'var(--chart-1)' },
  windGustsKmh: { label: 'Wind Gusts', color: 'var(--chart-2)' },
  windSpeedDisplay: { label: 'Wind Speed', color: 'var(--chart-1)' },
  windGustsDisplay: { label: 'Wind Gusts', color: 'var(--chart-2)' },
};

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function windColorForType(type: string): string {
  switch (type) {
    case 'headwind':
      return '#ef4444';
    case 'tailwind':
      return '#22c55e';
    default:
      return '#eab308';
  }
}

function getDominantWeather(points: WeatherPanelPoint[]): { description: string; icon: string } {
  const counts = new Map<number, number>();
  for (const p of points) {
    counts.set(p.weatherCode, (counts.get(p.weatherCode) ?? 0) + 1);
  }
  let maxCode = 0;
  let maxCount = 0;
  for (const [code, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      maxCode = code;
    }
  }
  return getWeatherDescription(maxCode);
}

export default function WeatherPageClient({
  routeId,
  routeName,
  distanceMeters,
  trackPoints,
  bounds,
  initialWeatherData,
}: WeatherPageClientProps) {
  const [weatherData, setWeatherData] = useState<WeatherState | null>(initialWeatherData);
  const [weatherFormOpen, setWeatherFormOpen] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const { imperial } = useUnits();

  const chartData = useMemo(
    () =>
      weatherData?.points.map((p) => ({
        ...p,
        time: formatTime(p.estimatedArrivalTime),
        distKm: formatDistanceRound(p.distanceFromStartM, imperial),
        tempDisplay: imperial ? celsiusToFahrenheit(p.tempC) : p.tempC,
        feelsLikeDisplay: imperial ? celsiusToFahrenheit(p.feelsLikeC) : p.feelsLikeC,
        windSpeedDisplay: imperial ? kmhToMph(p.windSpeedKmh) : p.windSpeedKmh,
        windGustsDisplay: imperial ? kmhToMph(p.windGustsKmh) : p.windGustsKmh,
        weatherDesc: getWeatherDescription(p.weatherCode).description,
        windColor: windColorForType(p.windClassification.type),
        windType: p.windClassification.type,
      })) ?? [],
    [weatherData?.points, imperial],
  );

  const handleFetchWeather = async (values: { startTime: string; averageSpeedKmh: number }) => {
    setWeatherLoading(true);
    try {
      const res = await fetch(`/api/routes/${routeId}/weather`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        const data = await res.json();
        setWeatherData(data);
        setWeatherFormOpen(false);
      }
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleClearWeather = async () => {
    const res = await fetch(`/api/routes/${routeId}/weather`, { method: 'DELETE' });
    if (res.ok) {
      setWeatherData(null);
    }
  };

  const startDate = weatherData
    ? new Date(weatherData.startTime).toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : '';

  const startTime = weatherData
    ? new Date(weatherData.startTime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const dominant = weatherData ? getDominantWeather(weatherData.points) : null;

  const avgTemp = weatherData
    ? weatherData.points.reduce((sum, p) => sum + p.tempC, 0) / weatherData.points.length
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/routes/${routeId}`}>{routeName}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Weather Forecast</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {!weatherData ? (
          <Card className="mt-6">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <CloudOff size={48} className="text-muted-foreground" />
              <div>
                <h2 className="text-lg font-semibold">No Weather Forecast</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  No weather forecast data exists for this route yet. Fetch a forecast to see
                  temperature, precipitation, and wind conditions along your{' '}
                  {formatDistance(distanceMeters, imperial)} ride.
                </p>
              </div>
              <Button onClick={() => setWeatherFormOpen(true)}>
                <CloudSun size={14} className="mr-2" />
                Get Weather Forecast
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mt-6">
              <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4">
                <div className="text-2xl">{dominant?.icon}</div>
                <div>
                  <div className="text-sm font-semibold">
                    {startDate} at {startTime}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {dominant?.description} &middot; {formatTemp(avgTemp, imperial)} avg &middot;{' '}
                    {formatSpeed(weatherData.averageSpeedKmh, imperial)}
                  </div>
                </div>
                <div className="ml-auto flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setWeatherFormOpen(true)}>
                    <RefreshCw size={14} className="mr-1" />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClearWeather}>
                    <Trash2 size={14} className="mr-1" />
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 overflow-hidden rounded-lg border border-border">
              <div className="h-[350px]">
                <DynamicMap
                  trackPoints={trackPoints}
                  bounds={bounds}
                  windArrows={weatherData.points}
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Temperature Chart */}
              <div>
                <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Temperature</h4>
                <ChartContainer config={tempConfig} className="aspect-[2/1] w-full">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} unit={tempUnit(imperial)} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(_, payload) => {
                            if (!payload?.[0]?.payload) return '';
                            const d = payload[0].payload;
                            return `${d.time} · ${d.distKm} · ${d.weatherDesc}`;
                          }}
                        />
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="tempDisplay"
                      stroke="var(--color-tempC)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="feelsLikeDisplay"
                      stroke="var(--color-feelsLikeC)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              </div>

              {/* Wind Chart */}
              <div>
                <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Wind</h4>
                <ChartContainer config={windConfig} className="aspect-[2/1] w-full">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} unit={speedUnit(imperial)} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(_, payload) => {
                            if (!payload?.[0]?.payload) return '';
                            const d = payload[0].payload;
                            return `${d.time} · ${d.distKm} · ${d.windType}`;
                          }}
                        />
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="windSpeedDisplay"
                      stroke="var(--color-windSpeedKmh)"
                      strokeWidth={2}
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        return (
                          <circle
                            key={`wind-dot-${cx}-${cy}`}
                            cx={cx}
                            cy={cy}
                            r={4}
                            fill={payload.windColor}
                            stroke="none"
                          />
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="windGustsDisplay"
                      stroke="var(--color-windGustsKmh)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
                <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#ef4444]" /> Headwind
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#22c55e]" /> Tailwind
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#eab308]" /> Crosswind
                  </span>
                </div>
              </div>

              {/* Cloud Cover Chart */}
              <div>
                <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Cloud Cover</h4>
                <ChartContainer config={cloudConfig} className="aspect-[2/1] w-full">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(_, payload) => {
                            if (!payload?.[0]?.payload) return '';
                            const d = payload[0].payload;
                            return `${d.time} · ${d.distKm}`;
                          }}
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="cloudCoverPercent"
                      fill="var(--color-cloudCoverPercent)"
                      stroke="var(--color-cloudCoverPercent)"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>

              {/* Precipitation Chart */}
              <div>
                <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Precipitation</h4>
                <ChartContainer config={precipConfig} className="aspect-[2/1] w-full">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} unit="mm" />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(_, payload) => {
                            if (!payload?.[0]?.payload) return '';
                            const d = payload[0].payload;
                            return `${d.time} · ${d.distKm}`;
                          }}
                        />
                      }
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="precipMm"
                      fill="var(--color-precipMm)"
                      opacity={0.7}
                      radius={[2, 2, 0, 0]}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="precipProbability"
                      stroke="var(--color-precipProbability)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          </>
        )}
      </div>

      <WeatherForm
        open={weatherFormOpen}
        onOpenChange={setWeatherFormOpen}
        onSubmit={handleFetchWeather}
        isLoading={weatherLoading}
      />
    </div>
  );
}
