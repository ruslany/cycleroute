import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { parseGpx } from '@/lib/gpx';
import { downloadGpx } from '@/lib/blob';
import RouteHeader from '@/components/RouteHeader';
import RouteStats from '@/components/RouteStats';
import DynamicMap from '@/components/map/DynamicMap';

interface RoutePageProps {
  params: Promise<{ id: string }>;
}

export default async function RoutePage({ params }: RoutePageProps) {
  const { id } = await params;

  const route = await prisma.route.findUnique({
    where: { id },
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

  return (
    <div className="flex h-screen flex-col">
      <div className="border-b border-border bg-card px-4 py-3">
        <RouteHeader routeId={route.id} initialName={route.name} />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 shrink-0 overflow-y-auto border-r border-border bg-muted p-4">
          <RouteStats
            distanceMeters={route.distanceMeters}
            elevationGainM={route.elevationGainM}
            pointCount={gpxResult.trackPoints.length}
          />
        </aside>
        <main className="flex-1">
          <DynamicMap trackPoints={trackPoints} bounds={gpxResult.bounds} />
        </main>
      </div>
    </div>
  );
}
