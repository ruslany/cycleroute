import { haversineDistance, type TrackPoint } from '@/lib/gpx';

const SAMPLE_INTERVAL_M = 10000; // ~10km between samples

export interface SamplePoint {
  latitude: number;
  longitude: number;
  elevation: number | null;
  distanceFromStartM: number;
  estimatedArrivalTime: Date;
  travelDirectionDeg: number;
}

export interface WeatherPoint extends SamplePoint {
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

export type WindType = 'headwind' | 'tailwind' | 'crosswind-left' | 'crosswind-right';

export interface WindClassification {
  type: WindType;
  relativeAngle: number;
}

export function bearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function classifyWind(travelDeg: number, windFromDeg: number): WindClassification {
  // Wind "from" direction means wind blows FROM that direction.
  // A headwind means wind is coming from the direction you're traveling toward.
  let relative = (((windFromDeg - travelDeg) % 360) + 360) % 360;
  if (relative > 180) relative = relative - 360;

  const absAngle = Math.abs(relative);

  let type: WindType;
  if (absAngle <= 45) {
    type = 'headwind';
  } else if (absAngle >= 135) {
    type = 'tailwind';
  } else if (relative > 0) {
    type = 'crosswind-right';
  } else {
    type = 'crosswind-left';
  }

  return { type, relativeAngle: relative };
}

export function sampleRoutePoints(
  trackPoints: TrackPoint[],
  startTime: Date,
  avgSpeedKmh: number,
): SamplePoint[] {
  if (trackPoints.length < 2) return [];

  const avgSpeedMs = (avgSpeedKmh * 1000) / 3600; // m/s
  const samples: SamplePoint[] = [];
  let cumulativeDistance = 0;
  let nextSampleDistance = 0;

  // Always include first point
  samples.push({
    latitude: trackPoints[0].latitude,
    longitude: trackPoints[0].longitude,
    elevation: trackPoints[0].elevation,
    distanceFromStartM: 0,
    estimatedArrivalTime: new Date(startTime),
    travelDirectionDeg: bearing(
      trackPoints[0].latitude,
      trackPoints[0].longitude,
      trackPoints[1].latitude,
      trackPoints[1].longitude,
    ),
  });
  nextSampleDistance = SAMPLE_INTERVAL_M;

  for (let i = 1; i < trackPoints.length; i++) {
    const prev = trackPoints[i - 1];
    const curr = trackPoints[i];
    const segmentDist = haversineDistance(
      prev.latitude,
      prev.longitude,
      curr.latitude,
      curr.longitude,
    );
    cumulativeDistance += segmentDist;

    while (cumulativeDistance >= nextSampleDistance && i < trackPoints.length) {
      const arrivalTimeSec = nextSampleDistance / avgSpeedMs;
      const nextIdx = Math.min(i + 1, trackPoints.length - 1);
      const travelDir = bearing(
        prev.latitude,
        prev.longitude,
        trackPoints[nextIdx].latitude,
        trackPoints[nextIdx].longitude,
      );

      // Interpolate position along segment
      const overshoot = cumulativeDistance - nextSampleDistance;
      const fraction = segmentDist > 0 ? 1 - overshoot / segmentDist : 1;
      const lat = prev.latitude + (curr.latitude - prev.latitude) * fraction;
      const lon = prev.longitude + (curr.longitude - prev.longitude) * fraction;
      const elev =
        prev.elevation !== null && curr.elevation !== null
          ? prev.elevation + (curr.elevation - prev.elevation) * fraction
          : curr.elevation;

      samples.push({
        latitude: lat,
        longitude: lon,
        elevation: elev,
        distanceFromStartM: nextSampleDistance,
        estimatedArrivalTime: new Date(startTime.getTime() + arrivalTimeSec * 1000),
        travelDirectionDeg: travelDir,
      });

      nextSampleDistance += SAMPLE_INTERVAL_M;
    }
  }

  // Always include last point if not already very close to last sample
  const lastTrack = trackPoints[trackPoints.length - 1];
  const totalDistance = cumulativeDistance;
  const lastSampleDist = samples[samples.length - 1].distanceFromStartM;

  if (totalDistance - lastSampleDist > SAMPLE_INTERVAL_M * 0.1) {
    const prevIdx = trackPoints.length - 2;
    samples.push({
      latitude: lastTrack.latitude,
      longitude: lastTrack.longitude,
      elevation: lastTrack.elevation,
      distanceFromStartM: totalDistance,
      estimatedArrivalTime: new Date(startTime.getTime() + (totalDistance / avgSpeedMs) * 1000),
      travelDirectionDeg: bearing(
        trackPoints[prevIdx].latitude,
        trackPoints[prevIdx].longitude,
        lastTrack.latitude,
        lastTrack.longitude,
      ),
    });
  }

  return samples;
}

interface OpenMeteoHourlyResponse {
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: number[];
    precipitation: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    wind_gusts_10m: number[];
    weather_code: number[];
    cloud_cover: number[];
  };
}

async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (res.ok) return res;
      if (i < retries) await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    } catch (err) {
      if (i < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
      } else {
        throw new Error(`Open-Meteo request failed for ${url}: ${err}`);
      }
    }
  }
  throw new Error(`Open-Meteo request failed for ${url}`);
}

export async function fetchOpenMeteoWeather(samplePoints: SamplePoint[]): Promise<WeatherPoint[]> {
  const CONCURRENCY = 5;
  const results: WeatherPoint[] = [];

  for (let i = 0; i < samplePoints.length; i += CONCURRENCY) {
    const batch = samplePoints.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (point): Promise<WeatherPoint> => {
        const url = new URL('https://api.open-meteo.com/v1/forecast');
        url.searchParams.set('latitude', point.latitude.toFixed(4));
        url.searchParams.set('longitude', point.longitude.toFixed(4));
        url.searchParams.set(
          'hourly',
          'temperature_2m,apparent_temperature,precipitation_probability,precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code,cloud_cover',
        );
        url.searchParams.set('timezone', 'auto');

        const res = await fetchWithRetry(url.toString());
        const data: OpenMeteoHourlyResponse = await res.json();

        // Find closest hourly index to estimatedArrivalTime
        const targetTime = point.estimatedArrivalTime.getTime();
        let closestIdx = 0;
        let closestDiff = Infinity;
        for (let j = 0; j < data.hourly.time.length; j++) {
          const diff = Math.abs(new Date(data.hourly.time[j]).getTime() - targetTime);
          if (diff < closestDiff) {
            closestDiff = diff;
            closestIdx = j;
          }
        }

        const h = data.hourly;
        const windDirDeg = h.wind_direction_10m[closestIdx];
        const windClass = classifyWind(point.travelDirectionDeg, windDirDeg);

        return {
          ...point,
          tempC: h.temperature_2m[closestIdx],
          feelsLikeC: h.apparent_temperature[closestIdx],
          precipProbability: h.precipitation_probability[closestIdx],
          precipMm: h.precipitation[closestIdx],
          windSpeedKmh: h.wind_speed_10m[closestIdx],
          windGustsKmh: h.wind_gusts_10m[closestIdx],
          windDirectionDeg: windDirDeg,
          cloudCoverPercent: h.cloud_cover[closestIdx],
          weatherCode: h.weather_code[closestIdx],
          windClassification: windClass,
        };
      }),
    );
    results.push(...batchResults);
  }

  return results;
}
