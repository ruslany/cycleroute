import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseGpx } from '@/lib/gpx';
import { downloadGpx } from '@/lib/blob';
import { buildExportGpx } from '@/lib/gpx-export';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const route = await prisma.route.findUnique({
      where: { id },
      include: { pois: true },
    });

    if (!route) {
      return new Response('Route not found', { status: 404 });
    }

    const gpxData = await downloadGpx(route.gpxBlobUrl);
    const parsed = parseGpx(gpxData);

    const gpxXml = buildExportGpx({
      name: route.name,
      description: route.description ?? undefined,
      trackPoints: parsed.trackPoints,
      waypoints: route.pois.map((poi) => ({
        name: poi.name,
        latitude: poi.latitude,
        longitude: poi.longitude,
        category: poi.category,
        description: poi.description ?? undefined,
      })),
    });

    const safeName = route.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `${safeName}-${dateStr}.gpx`;

    return new Response(gpxXml, {
      headers: {
        'Content-Type': 'application/gpx+xml',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return new Response('Failed to export route', { status: 500 });
  }
}
