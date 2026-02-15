'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
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
import { getWeatherDescription } from '@/lib/weather-codes';
import type { WindClassification } from '@/lib/weather';
import { useUnits } from '@/components/units-provider';
import {
  formatDistanceRound,
  formatSpeed,
  tempUnit,
  speedUnit,
  elevationUnit,
  celsiusToFahrenheit,
  kmhToMph,
  metersToFeet,
} from '@/lib/units';

export interface WeatherPanelPoint {
  latitude: number;
  longitude: number;
  distanceFromStartM: number;
  estimatedArrivalTime: string;
  travelDirectionDeg: number;
  tempC: number;
  feelsLikeC: number;
  precipProbability: number;
  precipMm: number;
  windSpeedKmh: number;
  windGustsKmh: number;
  windDirectionDeg: number;
  cloudCoverPercent: number;
  weatherCode: number;
  windClassification: WindClassification;
}

interface WeatherPanelProps {
  points: WeatherPanelPoint[];
  startTime: string;
  averageSpeedKmh: number;
  trackPoints: { latitude: number; longitude: number; elevation?: number | null }[];
  onClear?: () => void;
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
  cloudCoverPercent: { label: 'Cloud Cover (%)', color: 'var(--chart-5)' },
};

const windConfig: ChartConfig = {
  windSpeedKmh: { label: 'Wind Speed', color: 'var(--chart-1)' },
  windGustsKmh: { label: 'Wind Gusts', color: 'var(--chart-2)' },
  windSpeedDisplay: { label: 'Wind Speed', color: 'var(--chart-1)' },
  windGustsDisplay: { label: 'Wind Gusts', color: 'var(--chart-2)' },
};

const elevationConfig: ChartConfig = {
  elevation: { label: 'Elevation (m)', color: 'var(--chart-1)' },
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

export default function WeatherPanel({
  points,
  startTime,
  averageSpeedKmh,
  trackPoints,
  onClear,
}: WeatherPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const { imperial } = useUnits();

  const chartData = useMemo(
    () =>
      points.map((p) => ({
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
      })),
    [points, imperial],
  );

  const elevationData = useMemo(() => {
    if (!trackPoints.length || trackPoints[0].elevation == null) return [];
    const step = Math.max(1, Math.floor(trackPoints.length / Math.max(points.length * 3, 20)));
    const data = [];
    for (let i = 0; i < trackPoints.length; i += step) {
      const tp = trackPoints[i];
      const fraction = i / (trackPoints.length - 1);
      const totalDist = points.length > 0 ? points[points.length - 1].distanceFromStartM : 0;
      const elev = tp.elevation ?? 0;
      data.push({
        distKm: formatDistanceRound(fraction * totalDist, imperial),
        elevation: imperial ? metersToFeet(elev) : elev,
      });
    }
    return data;
  }, [trackPoints, points, imperial]);

  const startDate = new Date(startTime).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="border-t border-border bg-card">
      <div className="flex items-center justify-between px-4 py-2 text-sm font-medium">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex flex-1 items-center gap-2 hover:text-foreground/80"
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          <span>
            Weather Forecast — {startDate} at {formatSpeed(averageSpeedKmh, imperial)}
          </span>
        </button>
        {onClear && (
          <button
            onClick={onClear}
            className="ml-2 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title="Clear weather data"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      {expanded && (
        <div className="max-h-[40vh] overflow-y-auto px-4 pb-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Temperature Chart */}
            <div>
              <h4 className="mb-2 text-xs font-semibold text-muted-foreground">Temperature</h4>
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

            {/* Precipitation & Cloud Cover Chart */}
            <div>
              <h4 className="mb-2 text-xs font-semibold text-muted-foreground">
                Precipitation & Cloud Cover
              </h4>
              <ChartContainer config={precipConfig} className="aspect-[2/1] w-full">
                <ComposedChart data={chartData}>
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
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="cloudCoverPercent"
                    fill="var(--color-cloudCoverPercent)"
                    stroke="var(--color-cloudCoverPercent)"
                    fillOpacity={0.15}
                  />
                </ComposedChart>
              </ChartContainer>
            </div>

            {/* Wind Chart */}
            <div>
              <h4 className="mb-2 text-xs font-semibold text-muted-foreground">Wind</h4>
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

            {/* Elevation Chart */}
            <div>
              <h4 className="mb-2 text-xs font-semibold text-muted-foreground">Elevation</h4>
              {elevationData.length > 0 ? (
                <ChartContainer config={elevationConfig} className="aspect-[2/1] w-full">
                  <AreaChart data={elevationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="distKm" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} unit={elevationUnit(imperial)} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="elevation"
                      stroke="var(--color-elevation)"
                      fill="var(--color-elevation)"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="flex aspect-[2/1] items-center justify-center text-sm text-muted-foreground">
                  No elevation data available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
