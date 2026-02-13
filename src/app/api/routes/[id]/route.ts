import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseGpx } from '@/lib/gpx';
import { downloadGpx, deleteGpx } from '@/lib/blob';
import { updateRouteSchema } from '@/lib/validations/route';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const route = await prisma.route.findUnique({
      where: { id },
      include: { pois: true },
    });

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    const gpxData = await downloadGpx(route.gpxBlobUrl);
    const gpxResult = parseGpx(gpxData);

    return NextResponse.json({
      ...route,
      trackPoints: gpxResult.trackPoints,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch route' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateRouteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const route = await prisma.route.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(route);
  } catch {
    return NextResponse.json({ error: 'Failed to update route' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const route = await prisma.route.delete({ where: { id } });
    await deleteGpx(route.gpxBlobUrl);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete route' }, { status: 500 });
  }
}
