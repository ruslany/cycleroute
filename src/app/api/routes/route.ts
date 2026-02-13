import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseGpx } from "@/lib/gpx";
import { createRouteSchema } from "@/lib/validations/route";

const BATCH_SIZE = 13000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createRouteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, description, gpxData } = parsed.data;
    const gpxResult = parseGpx(gpxData);

    const route = await prisma.$transaction(async (tx) => {
      const route = await tx.route.create({
        data: {
          name: name || gpxResult.name,
          description,
          originalGpx: gpxData,
          distanceMeters: gpxResult.distanceMeters,
          elevationGainM: gpxResult.elevationGainM,
        },
      });

      // Batch createMany to stay within PostgreSQL parameter limit
      const points = gpxResult.trackPoints.map((p, i) => ({
        routeId: route.id,
        sequence: i,
        latitude: p.latitude,
        longitude: p.longitude,
        elevation: p.elevation,
      }));

      for (let i = 0; i < points.length; i += BATCH_SIZE) {
        await tx.routePoint.createMany({
          data: points.slice(i, i + BATCH_SIZE),
        });
      }

      return route;
    });

    return NextResponse.json(route, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create route";
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(routes);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch routes" },
      { status: 500 }
    );
  }
}
