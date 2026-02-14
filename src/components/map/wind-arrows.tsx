'use client';

import L from 'leaflet';
import { Marker, Popup } from 'react-leaflet';
import { useMemo } from 'react';
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

function createWindIcon(windDirectionDeg: number, type: string) {
  const color = windColor(type);
  // Wind arrows point in the direction wind is blowing TO (from + 180)
  const rotationDeg = (windDirectionDeg + 180) % 360;
  return L.divIcon({
    className: 'wind-arrow-marker',
    html: `<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;transform:rotate(${rotationDeg}deg);">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L8 10H16L12 2Z" fill="${color}" stroke="${color}" stroke-width="1"/>
        <line x1="12" y1="10" x2="12" y2="22" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

interface WindArrowsProps {
  points: WeatherPanelPoint[];
}

export default function WindArrows({ points }: WindArrowsProps) {
  const markers = useMemo(
    () =>
      points.map((p, i) => ({
        key: `wind-${i}`,
        position: [p.latitude, p.longitude] as [number, number],
        icon: createWindIcon(p.windDirectionDeg, p.windClassification.type),
        point: p,
      })),
    [points],
  );

  return (
    <>
      {markers.map((m) => (
        <Marker key={m.key} position={m.position} icon={m.icon}>
          <Popup>
            <div className="text-sm">
              <div className="font-semibold">{windLabel(m.point.windClassification.type)}</div>
              <div className="text-xs">
                Speed: {m.point.windSpeedKmh.toFixed(1)} km/h
                <br />
                Gusts: {m.point.windGustsKmh.toFixed(1)} km/h
                <br />
                Direction: {m.point.windDirectionDeg}°
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
