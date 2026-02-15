'use client';

import '@/lib/leaflet-setup';
import L, { LatLngBoundsExpression, LatLngTuple } from 'leaflet';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import { useEffect, useRef } from 'react';
import { POI_CATEGORY_CONFIG } from '@/lib/poi-categories';
import type { PoiCategory } from '@/lib/validations/poi';
import WindRoute from '@/components/map/wind-route';
import type { WeatherPanelPoint } from '@/lib/weather';

interface FitBoundsProps {
  bounds: LatLngBoundsExpression;
}

function FitBounds({ bounds }: FitBoundsProps) {
  const map = useMap();
  const hasFit = useRef(false);
  useEffect(() => {
    if (!hasFit.current) {
      map.fitBounds(bounds, { padding: [30, 30] });
      hasFit.current = true;
    }
  }, [map, bounds]);
  return null;
}

function InvalidateOnResize() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
}

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

function FitRouteControl({ bounds }: FitBoundsProps) {
  const map = useMap();
  useEffect(() => {
    const control = new L.Control({ position: 'topleft' });
    control.onAdd = () => {
      const btn = L.DomUtil.create('button', 'leaflet-bar leaflet-control');
      btn.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>';
      btn.title = 'Fit entire route';
      btn.style.cssText =
        'width:34px;height:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;background:#fff;color:#333;font-size:18px;';
      L.DomEvent.disableClickPropagation(btn);
      btn.addEventListener('click', () => {
        map.fitBounds(bounds, { padding: [30, 30] });
      });
      return btn;
    };
    control.addTo(map);
    return () => {
      control.remove();
    };
  }, [map, bounds]);
  return null;
}

function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function createPoiIcon(color: string) {
  return L.divIcon({
    className: 'poi-marker',
    html: `<div style="width:24px;height:24px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

export interface PoiData {
  id: string;
  name: string;
  description: string | null;
  category: string;
  latitude: number;
  longitude: number;
}

interface RouteMapProps {
  trackPoints: { latitude: number; longitude: number }[];
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  pois?: PoiData[];
  isAddingPoi?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  onPoiClick?: (poi: PoiData) => void;
  windArrows?: WeatherPanelPoint[];
}

export default function RouteMap({
  trackPoints,
  bounds,
  pois,
  isAddingPoi,
  onMapClick,
  onPoiClick,
  windArrows,
}: RouteMapProps) {
  const positions: LatLngTuple[] = trackPoints.map((p) => [p.latitude, p.longitude]);

  const leafletBounds: LatLngBoundsExpression = [
    [bounds.minLat, bounds.minLon],
    [bounds.maxLat, bounds.maxLon],
  ];

  return (
    <div className={isAddingPoi ? 'h-full w-full cursor-crosshair' : 'h-full w-full'}>
      <MapContainer
        bounds={leafletBounds}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {windArrows && windArrows.length > 0 ? (
          <WindRoute trackPoints={trackPoints} weatherPoints={windArrows} />
        ) : (
          <Polyline positions={positions} color="#2563eb" weight={4} />
        )}
        <FitBounds bounds={leafletBounds} />
        <FitRouteControl bounds={leafletBounds} />
        <InvalidateOnResize />
        {isAddingPoi && onMapClick && <MapClickHandler onMapClick={onMapClick} />}
        {pois?.map((poi) => {
          const category = poi.category as PoiCategory;
          const config = POI_CATEGORY_CONFIG[category] ?? POI_CATEGORY_CONFIG.OTHER;
          return (
            <Marker
              key={poi.id}
              position={[poi.latitude, poi.longitude]}
              icon={createPoiIcon(config.color)}
              eventHandlers={onPoiClick ? { click: () => onPoiClick(poi) } : undefined}
            >
              <Popup>
                <div className="text-sm">
                  <strong>{poi.name}</strong>
                  <div className="text-xs text-gray-500">{config.label}</div>
                  {poi.description && <p className="mt-1 text-xs">{poi.description}</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
