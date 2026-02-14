// @ts-expect-error — @garmin/fitsdk has no type declarations
import { Encoder, Profile } from '@garmin/fitsdk';
import type { TrackPoint } from '@/lib/gpx';
import { haversineDistance } from '@/lib/gpx';

export interface FitCoursePoint {
  name: string;
  latitude: number;
  longitude: number;
  distanceM: number;
  type: string;
}

export interface FitExportOptions {
  name: string;
  trackPoints: TrackPoint[];
  coursePoints: FitCoursePoint[];
}

const SEMICIRCLES_PER_DEGREE = 2 ** 31 / 180;

function toSemicircles(degrees: number): number {
  return Math.round(degrees * SEMICIRCLES_PER_DEGREE);
}

const INSTRUCTION_TO_COURSE_POINT_TYPE: Record<string, string> = {
  'turn left': 'left',
  left: 'left',
  'turn right': 'right',
  right: 'right',
  straight: 'straight',
  continue: 'straight',
  'sharp left': 'sharpLeft',
  'sharp right': 'sharpRight',
  'slight left': 'slightLeft',
  'bear left': 'slightLeft',
  'slight right': 'slightRight',
  'bear right': 'slightRight',
  'u-turn': 'uTurn',
  food: 'food',
  'rest stop': 'food',
  water: 'water',
};

export function mapInstructionToType(instruction: string): string {
  const normalized = instruction.toLowerCase().trim();
  return INSTRUCTION_TO_COURSE_POINT_TYPE[normalized] ?? 'generic';
}

const POI_CATEGORY_TO_COURSE_POINT_TYPE: Record<string, string> = {
  FOOD: 'food',
  WATER: 'water',
  RESTROOM: 'restArea',
  VIEWPOINT: 'summit',
  CAUTION: 'danger',
  OTHER: 'generic',
};

export function mapPoiCategoryToType(category: string): string {
  return POI_CATEGORY_TO_COURSE_POINT_TYPE[category] ?? 'generic';
}

/**
 * Find the distance along the track where a point is closest,
 * by projecting onto each track segment.
 */
export function snapDistanceAlongTrack(
  lat: number,
  lon: number,
  trackPoints: TrackPoint[],
  cumulativeDistances: number[],
): number {
  let bestDist = Infinity;
  let bestAlongTrack = 0;

  for (let i = 0; i < trackPoints.length; i++) {
    const d = haversineDistance(lat, lon, trackPoints[i].latitude, trackPoints[i].longitude);
    if (d < bestDist) {
      bestDist = d;
      bestAlongTrack = cumulativeDistances[i];
    }
  }

  return bestAlongTrack;
}

export function buildExportFit({ name, trackPoints, coursePoints }: FitExportOptions): Uint8Array {
  const encoder = new Encoder();
  const baseTime = new Date('2024-01-01T00:00:00Z');

  // Compute cumulative distances for track points
  const cumulativeDistances: number[] = [0];
  for (let i = 1; i < trackPoints.length; i++) {
    const prev = trackPoints[i - 1];
    const curr = trackPoints[i];
    const segDist = haversineDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
    cumulativeDistances.push(cumulativeDistances[i - 1] + segDist);
  }

  const totalDistance = cumulativeDistances[cumulativeDistances.length - 1];
  const totalTimeSeconds = trackPoints.length - 1;

  const startTime = new Date(baseTime.getTime());
  const endTime = new Date(baseTime.getTime() + totalTimeSeconds * 1000);

  const first = trackPoints[0];
  const last = trackPoints[trackPoints.length - 1];

  // 1. FILE_ID
  encoder.onMesg(Profile.MesgNum.FILE_ID, {
    type: 'course',
    manufacturer: 'development',
    product: 0,
    timeCreated: startTime,
    serialNumber: 12345,
  });

  // 2. COURSE
  encoder.onMesg(Profile.MesgNum.COURSE, {
    name: name.slice(0, 32),
    sport: 'cycling',
  });

  // 3. LAP
  encoder.onMesg(Profile.MesgNum.LAP, {
    timestamp: startTime,
    startTime: startTime,
    startPositionLat: toSemicircles(first.latitude),
    startPositionLong: toSemicircles(first.longitude),
    endPositionLat: toSemicircles(last.latitude),
    endPositionLong: toSemicircles(last.longitude),
    totalDistance: totalDistance,
    totalTimerTime: totalTimeSeconds,
    totalElapsedTime: totalTimeSeconds,
  });

  // 4. EVENT — timer start
  encoder.onMesg(Profile.MesgNum.EVENT, {
    timestamp: startTime,
    event: 'timer',
    eventType: 'start',
    eventGroup: 0,
  });

  // 5. RECORD messages — one per track point
  for (let i = 0; i < trackPoints.length; i++) {
    const tp = trackPoints[i];
    const timestamp = new Date(baseTime.getTime() + i * 1000);

    const record: Record<string, unknown> = {
      timestamp,
      positionLat: toSemicircles(tp.latitude),
      positionLong: toSemicircles(tp.longitude),
      distance: cumulativeDistances[i],
    };

    if (tp.elevation !== null) {
      record.altitude = tp.elevation;
    }

    encoder.onMesg(Profile.MesgNum.RECORD, record);
  }

  // 6. COURSE_POINT messages
  for (let i = 0; i < coursePoints.length; i++) {
    const cp = coursePoints[i];
    // Estimate timestamp from distance: find interpolated time position
    const timeFraction = totalDistance > 0 ? Math.min(cp.distanceM / totalDistance, 1) : 0;
    const cpTimestamp = new Date(baseTime.getTime() + timeFraction * totalTimeSeconds * 1000);

    encoder.onMesg(Profile.MesgNum.COURSE_POINT, {
      messageIndex: i,
      timestamp: cpTimestamp,
      positionLat: toSemicircles(cp.latitude),
      positionLong: toSemicircles(cp.longitude),
      distance: cp.distanceM,
      type: cp.type,
      name: cp.name.slice(0, 32),
    });
  }

  // 7. EVENT — timer stop
  encoder.onMesg(Profile.MesgNum.EVENT, {
    timestamp: endTime,
    event: 'timer',
    eventType: 'stopAll',
    eventGroup: 0,
  });

  return encoder.close();
}
