import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPoiSchema } from '@/lib/validations/poi';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const pois = await prisma.pOI.findMany({
      where: { routeId: id },
      orderBy: { sequence: 'asc' },
    });

    return NextResponse.json(pois);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch POIs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = createPoiSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const route = await prisma.route.findUnique({ where: { id } });
    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    // Get next sequence number
    const lastPoi = await prisma.pOI.findFirst({
      where: { routeId: id },
      orderBy: { sequence: 'desc' },
    });
    const sequence = (lastPoi?.sequence ?? -1) + 1;

    const poi = await prisma.pOI.create({
      data: {
        ...parsed.data,
        routeId: id,
        sequence,
      },
    });

    return NextResponse.json(poi, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create POI' }, { status: 500 });
  }
}
