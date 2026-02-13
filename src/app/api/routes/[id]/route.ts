import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateRouteSchema } from '@/lib/validations/route';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        routePoints: { orderBy: { sequence: 'asc' } },
        pois: true,
      },
    });

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    return NextResponse.json(route);
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
    await prisma.route.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete route' }, { status: 500 });
  }
}
