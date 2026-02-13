import { DOMParser } from '@xmldom/xmldom';
import * as toGeoJSON from '@tmcw/togeojson';

export interface TrackPoint {
  latitude: number;
  longitude: number;
  elevation: number | null;
}

export interface ParsedGpx {
  name: string;
  trackPoints: TrackPoint[];
  distanceMeters: number;
  elevationGainM: number | null;
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function parseGpx(gpxString: string): ParsedGpx {
  const parser = new DOMParser();
  const doc = parser.parseFromString(gpxString, 'application/xml');
  const geoJson = toGeoJSON.gpx(doc);

  // Extract name from GPX metadata or first track
  const nameEl = doc.getElementsByTagName('name')[0];
  const name = nameEl?.textContent ?? 'Unnamed Route';

  // Find the first LineString or MultiLineString feature
  const lineFeature = geoJson.features.find(
    (f) => f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString',
  );

  if (!lineFeature) {
    throw new Error('No track found in GPX file');
  }

  // Extract coordinates [lon, lat, ele?]
  const geom = lineFeature.geometry;
  let coords: number[][];
  if (geom.type === 'MultiLineString') {
    coords = (geom.coordinates as number[][][]).flat();
  } else if (geom.type === 'LineString') {
    coords = geom.coordinates as number[][];
  } else {
    throw new Error('Unexpected geometry type');
  }

  const trackPoints: TrackPoint[] = coords.map((c) => ({
    latitude: c[1],
    longitude: c[0],
    elevation: c.length >= 3 ? c[2] : null,
  }));

  if (trackPoints.length === 0) {
    throw new Error('No track points found in GPX file');
  }

  // Compute total distance
  let distanceMeters = 0;
  for (let i = 1; i < trackPoints.length; i++) {
    distanceMeters += haversineDistance(
      trackPoints[i - 1].latitude,
      trackPoints[i - 1].longitude,
      trackPoints[i].latitude,
      trackPoints[i].longitude,
    );
  }

  // Compute elevation gain
  let elevationGainM: number | null = null;
  const hasElevation = trackPoints.some((p) => p.elevation !== null);
  if (hasElevation) {
    elevationGainM = 0;
    for (let i = 1; i < trackPoints.length; i++) {
      const prev = trackPoints[i - 1].elevation;
      const curr = trackPoints[i].elevation;
      if (prev !== null && curr !== null && curr > prev) {
        elevationGainM += curr - prev;
      }
    }
  }

  // Compute bounds
  let minLat = Infinity,
    maxLat = -Infinity,
    minLon = Infinity,
    maxLon = -Infinity;
  for (const p of trackPoints) {
    if (p.latitude < minLat) minLat = p.latitude;
    if (p.latitude > maxLat) maxLat = p.latitude;
    if (p.longitude < minLon) minLon = p.longitude;
    if (p.longitude > maxLon) maxLon = p.longitude;
  }

  return {
    name,
    trackPoints,
    distanceMeters,
    elevationGainM,
    bounds: { minLat, maxLat, minLon, maxLon },
  };
}
