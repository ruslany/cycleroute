import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { parseGpx } from '@/lib/gpx';
import { downloadGpx } from '@/lib/blob';
import RouteHeader from '@/components/RouteHeader';
import RouteDetailClient from '@/components/RouteDetailClient';

interface RoutePageProps {
  params: Promise<{ id: string }>;
}

export default async function RoutePage({ params }: RoutePageProps) {
  const { id } = await params;

  const route = await prisma.route.findUnique({
    where: { id },
    include: { pois: true },
  });

  if (!route) {
    notFound();
  }

  const gpxData = await downloadGpx(route.gpxBlobUrl);
  const gpxResult = parseGpx(gpxData);

  const trackPoints = gpxResult.trackPoints.map((p) => ({
    latitude: p.latitude,
    longitude: p.longitude,
  }));

  const pois = route.pois.map((poi) => ({
    id: poi.id,
    name: poi.name,
    description: poi.description,
    category: poi.category,
    latitude: poi.latitude,
    longitude: poi.longitude,
  }));

  return (
    <div className="flex h-screen flex-col">
      <div className="border-b border-border bg-card px-4 py-3">
        <RouteHeader routeId={route.id} initialName={route.name} />
      </div>
      <RouteDetailClient
        routeId={route.id}
        distanceMeters={route.distanceMeters}
        elevationGainM={route.elevationGainM}
        pointCount={gpxResult.trackPoints.length}
        trackPoints={trackPoints}
        bounds={gpxResult.bounds}
        initialPois={pois}
      />
    </div>
  );
}
