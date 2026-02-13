import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseGpx } from '@/lib/gpx';
import { uploadGpx } from '@/lib/blob';
import { createRouteSchema } from '@/lib/validations/route';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createRouteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, description, gpxData } = parsed.data;
    const gpxResult = parseGpx(gpxData);

    const blobUrl = await uploadGpx(`${Date.now()}.gpx`, gpxData);

    const route = await prisma.route.create({
      data: {
        name: name || gpxResult.name,
        description,
        gpxBlobUrl: blobUrl,
        distanceMeters: gpxResult.distanceMeters,
        elevationGainM: gpxResult.elevationGainM,
      },
    });

    return NextResponse.json(route, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create route';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const routes = await prisma.route.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        distanceMeters: true,
        elevationGainM: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(routes);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 });
  }
}
