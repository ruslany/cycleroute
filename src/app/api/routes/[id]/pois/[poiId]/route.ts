import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updatePoiSchema } from '@/lib/validations/poi';

type RouteParams = { params: Promise<{ id: string; poiId: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, poiId } = await params;
    const body = await request.json();
    const parsed = updatePoiSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const poi = await prisma.pOI.update({
      where: { id: poiId, routeId: id },
      data: parsed.data,
    });

    return NextResponse.json(poi);
  } catch {
    return NextResponse.json({ error: 'Failed to update POI' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id, poiId } = await params;
    await prisma.pOI.delete({
      where: { id: poiId, routeId: id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete POI' }, { status: 500 });
  }
}
