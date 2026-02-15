import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { parseGpx } from '@/lib/gpx';
import { downloadGpx } from '@/lib/blob';
import RouteHeader from '@/components/route-header';
import RouteDetailClient from '@/components/route-detail-client';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

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
    elevation: p.elevation,
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
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
      <div className="px-4 py-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{route.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="mt-1">
          <RouteHeader routeId={route.id} initialName={route.name} />
        </div>
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
