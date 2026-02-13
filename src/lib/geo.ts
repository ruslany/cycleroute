import { haversineDistance } from '@/lib/gpx';

interface Point {
  latitude: number;
  longitude: number;
}

/**
 * Calculate the distance along a track from the start to the closest point on the track
 * to the given point.
 */
export function distanceAlongTrack(trackPoints: Point[], point: Point): number {
  if (trackPoints.length === 0) return 0;
  if (trackPoints.length === 1) {
    return haversineDistance(
      trackPoints[0].latitude,
      trackPoints[0].longitude,
      point.latitude,
      point.longitude,
    );
  }

  let minDist = Infinity;
  let bestSegmentIndex = 0;
  let bestFraction = 0;

  // Find closest segment and projection fraction
  for (let i = 0; i < trackPoints.length - 1; i++) {
    const a = trackPoints[i];
    const b = trackPoints[i + 1];

    // Project point onto segment in simple lat/lon space
    const dx = b.longitude - a.longitude;
    const dy = b.latitude - a.latitude;
    const lenSq = dx * dx + dy * dy;

    let fraction = 0;
    if (lenSq > 0) {
      fraction = ((point.longitude - a.longitude) * dx + (point.latitude - a.latitude) * dy) / lenSq;
      fraction = Math.max(0, Math.min(1, fraction));
    }

    const projLat = a.latitude + fraction * dy;
    const projLon = a.longitude + fraction * dx;
    const dist = haversineDistance(projLat, projLon, point.latitude, point.longitude);

    if (dist < minDist) {
      minDist = dist;
      bestSegmentIndex = i;
      bestFraction = fraction;
    }
  }

  // Sum distance from start to the best segment
  let distance = 0;
  for (let i = 0; i < bestSegmentIndex; i++) {
    distance += haversineDistance(
      trackPoints[i].latitude,
      trackPoints[i].longitude,
      trackPoints[i + 1].latitude,
      trackPoints[i + 1].longitude,
    );
  }

  // Add fractional distance within the best segment
  const segStart = trackPoints[bestSegmentIndex];
  const segEnd = trackPoints[bestSegmentIndex + 1];
  const segLength = haversineDistance(
    segStart.latitude,
    segStart.longitude,
    segEnd.latitude,
    segEnd.longitude,
  );
  distance += segLength * bestFraction;

  return distance;
}
