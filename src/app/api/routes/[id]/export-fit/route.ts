import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseGpx } from '@/lib/gpx';
import { downloadGpx } from '@/lib/blob';
import {
  buildExportFit,
  mapInstructionToType,
  mapPoiCategoryToType,
  snapDistanceAlongTrack,
} from '@/lib/fit-export';
import { haversineDistance } from '@/lib/gpx';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        pois: true,
        cuePoints: { orderBy: { sequence: 'asc' } },
      },
    });

    if (!route) {
      return new Response('Route not found', { status: 404 });
    }

    const gpxData = await downloadGpx(route.gpxBlobUrl);
    const parsed = parseGpx(gpxData);

    // Compute cumulative distances for POI snapping
    const cumulativeDistances: number[] = [0];
    for (let i = 1; i < parsed.trackPoints.length; i++) {
      const prev = parsed.trackPoints[i - 1];
      const curr = parsed.trackPoints[i];
      const segDist = haversineDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude,
      );
      cumulativeDistances.push(cumulativeDistances[i - 1] + segDist);
    }

    const cuePointsCoursePoints = route.cuePoints.map((cp) => ({
      name: cp.instruction.slice(0, 32),
      latitude: cp.latitude,
      longitude: cp.longitude,
      distanceM: cp.distanceM ?? 0,
      type: mapInstructionToType(cp.instruction),
    }));

    const poiCoursePoints = route.pois.map((poi) => ({
      name: poi.name.slice(0, 32),
      latitude: poi.latitude,
      longitude: poi.longitude,
      distanceM: snapDistanceAlongTrack(
        poi.latitude,
        poi.longitude,
        parsed.trackPoints,
        cumulativeDistances,
      ),
      type: mapPoiCategoryToType(poi.category),
    }));

    // Merge and sort all course points by distance
    const coursePoints = [...cuePointsCoursePoints, ...poiCoursePoints].sort(
      (a, b) => a.distanceM - b.distanceM,
    );

    const fitData = buildExportFit({
      name: route.name,
      trackPoints: parsed.trackPoints,
      coursePoints,
    });

    const safeName = route.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `${safeName}-${dateStr}.fit`;

    return new Response(Buffer.from(fitData), {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return new Response('Failed to export route', { status: 500 });
  }
}
