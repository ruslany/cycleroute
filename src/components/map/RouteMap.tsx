"use client";

import "@/lib/leaflet-setup";
import { MapContainer, TileLayer, Polyline, useMap } from "react-leaflet";
import { LatLngBoundsExpression, LatLngTuple } from "leaflet";
import { useEffect } from "react";

interface FitBoundsProps {
  bounds: LatLngBoundsExpression;
}

function FitBounds({ bounds }: FitBoundsProps) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [map, bounds]);
  return null;
}

interface RouteMapProps {
  trackPoints: { latitude: number; longitude: number }[];
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
}

export default function RouteMap({ trackPoints, bounds }: RouteMapProps) {
  const positions: LatLngTuple[] = trackPoints.map((p) => [
    p.latitude,
    p.longitude,
  ]);

  const leafletBounds: LatLngBoundsExpression = [
    [bounds.minLat, bounds.minLon],
    [bounds.maxLat, bounds.maxLon],
  ];

  return (
    <MapContainer
      bounds={leafletBounds}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={positions} color="#2563eb" weight={4} />
      <FitBounds bounds={leafletBounds} />
    </MapContainer>
  );
}
