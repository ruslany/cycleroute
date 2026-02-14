'use client';

import L from 'leaflet';
import 'leaflet-polylinedecorator';
import { Polyline, Popup, CircleMarker, useMap } from 'react-leaflet';
import { useEffect, useMemo, useRef } from 'react';
import { haversineDistance } from '@/lib/gpx';
import type { WeatherPanelPoint } from '@/components/weather-panel';

function windColor(type: string): string {
  switch (type) {
    case 'headwind':
      return '#ef4444';
    case 'tailwind':
      return '#22c55e';
    default:
      return '#eab308';
  }
}

function windLabel(type: string): string {
  switch (type) {
    case 'headwind':
      return 'Headwind';
    case 'tailwind':
      return 'Tailwind';
    case 'crosswind-left':
      return 'Crosswind (left)';
    case 'crosswind-right':
      return 'Crosswind (right)';
    default:
      return 'Wind';
  }
}

interface Segment {
  positions: [number, number][];
  color: string;
}

interface WindRouteProps {
  trackPoints: { latitude: number; longitude: number }[];
  weatherPoints: WeatherPanelPoint[];
}

function ArrowDecorator({
  positions,
}: {
  positions: [number, number][];
}) {
  const map = useMap();
  const decoratorRef = useRef<L.PolylineDecorator | null>(null);

  useEffect(() => {
    if (positions.length < 2) return;

    const polyline = L.polyline(positions);
    const decorator = L.polylineDecorator(polyline, {
      patterns: [
        {
          offset: '50px',
          repeat: '150px',
          symbol: L.Symbol.arrowHead({
            pixelSize: 9,
            polygon: false,
            pathOptions: { stroke: true, color: '#444', weight: 2, opacity: 0.8 },
          }),
        },
      ],
    }).addTo(map);

    decoratorRef.current = decorator;

    return () => {
      decorator.remove();
    };
  }, [map, positions]);

  return null;
}

const LEGEND_ITEMS = [
  { color: '#22c55e', label: 'Tailwind' },
  { color: '#eab308', label: 'Crosswind' },
  { color: '#ef4444', label: 'Headwind' },
];

function WindLegend() {
  const map = useMap();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const control = new L.Control({ position: 'bottomright' });
    control.onAdd = () => {
      const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      div.style.cssText =
        'background:#fff;color:#333;padding:8px 10px;font-size:12px;line-height:1.6;border-radius:4px;';
      div.innerHTML =
        '<div style="font-weight:600;margin-bottom:4px;">Wind</div>' +
        LEGEND_ITEMS.map(
          (item) =>
            `<div style="display:flex;align-items:center;gap:6px;">` +
            `<span style="width:18px;height:4px;border-radius:2px;background:${item.color};display:inline-block;"></span>` +
            `<span>${item.label}</span></div>`,
        ).join('');
      L.DomEvent.disableClickPropagation(div);
      containerRef.current = div;
      return div;
    };
    control.addTo(map);
    return () => {
      control.remove();
    };
  }, [map]);

  return null;
}

export default function WindRoute({ trackPoints, weatherPoints }: WindRouteProps) {
  const segments = useMemo(() => {
    if (weatherPoints.length === 0 || trackPoints.length < 2) return [];

    // Build cumulative distances for track points
    const cumDist: number[] = [0];
    for (let i = 1; i < trackPoints.length; i++) {
      cumDist.push(
        cumDist[i - 1] +
          haversineDistance(
            trackPoints[i - 1].latitude,
            trackPoints[i - 1].longitude,
            trackPoints[i].latitude,
            trackPoints[i].longitude,
          ),
      );
    }

    // Sort weather points by distance
    const sortedWeather = [...weatherPoints].sort(
      (a, b) => a.distanceFromStartM - b.distanceFromStartM,
    );

    // For each track point, find nearest weather point by distance
    function getClassification(dist: number): string {
      let best = 0;
      let bestDiff = Math.abs(dist - sortedWeather[0].distanceFromStartM);
      for (let j = 1; j < sortedWeather.length; j++) {
        const diff = Math.abs(dist - sortedWeather[j].distanceFromStartM);
        if (diff < bestDiff) {
          bestDiff = diff;
          best = j;
        } else {
          break; // sorted, so diffs will only increase from here
        }
      }
      return sortedWeather[best].windClassification.type;
    }

    // Build segments of consecutive same-type points
    const result: Segment[] = [];
    let currentType = getClassification(cumDist[0]);
    let currentPositions: [number, number][] = [
      [trackPoints[0].latitude, trackPoints[0].longitude],
    ];

    for (let i = 1; i < trackPoints.length; i++) {
      const type = getClassification(cumDist[i]);
      const pos: [number, number] = [trackPoints[i].latitude, trackPoints[i].longitude];

      if (type !== currentType) {
        // Add this point to close the current segment
        currentPositions.push(pos);
        result.push({ positions: currentPositions, color: windColor(currentType) });
        // Start new segment from this point
        currentType = type;
        currentPositions = [pos];
      } else {
        currentPositions.push(pos);
      }
    }

    // Push final segment
    if (currentPositions.length >= 2) {
      result.push({ positions: currentPositions, color: windColor(currentType) });
    }

    return result;
  }, [trackPoints, weatherPoints]);

  const allPositions = useMemo<[number, number][]>(
    () => trackPoints.map((p) => [p.latitude, p.longitude]),
    [trackPoints],
  );

  return (
    <>
      {segments.map((seg, i) => (
        <Polyline key={`ws-${i}`} positions={seg.positions} color={seg.color} weight={4} />
      ))}
      <ArrowDecorator positions={allPositions} />
      <WindLegend />
      {weatherPoints.map((p, i) => (
        <CircleMarker
          key={`wp-${i}`}
          center={[p.latitude, p.longitude]}
          radius={5}
          pathOptions={{
            fillColor: windColor(p.windClassification.type),
            fillOpacity: 0.9,
            color: '#fff',
            weight: 2,
            opacity: 1,
          }}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-semibold">{windLabel(p.windClassification.type)}</div>
              <div className="text-xs">
                Speed: {p.windSpeedKmh.toFixed(1)} km/h
                <br />
                Gusts: {p.windGustsKmh.toFixed(1)} km/h
                <br />
                Direction: {p.windDirectionDeg}°
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}
