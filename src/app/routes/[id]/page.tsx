import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RouteHeader from "@/components/RouteHeader";
import RouteStats from "@/components/RouteStats";
import DynamicMap from "@/components/map/DynamicMap";

interface RoutePageProps {
  params: Promise<{ id: string }>;
}

export default async function RoutePage({ params }: RoutePageProps) {
  const { id } = await params;

  const route = await prisma.route.findUnique({
    where: { id },
    include: {
      routePoints: {
        orderBy: { sequence: "asc" },
        select: { latitude: true, longitude: true },
      },
    },
  });

  if (!route) {
    notFound();
  }

  // Compute bounds from points
  let minLat = Infinity,
    maxLat = -Infinity,
    minLon = Infinity,
    maxLon = -Infinity;
  for (const p of route.routePoints) {
    if (p.latitude < minLat) minLat = p.latitude;
    if (p.latitude > maxLat) maxLat = p.latitude;
    if (p.longitude < minLon) minLon = p.longitude;
    if (p.longitude > maxLon) maxLon = p.longitude;
  }

  const bounds = { minLat, maxLat, minLon, maxLon };

  return (
    <div className="flex h-screen flex-col">
      <div className="border-b bg-white px-4 py-3">
        <RouteHeader routeId={route.id} initialName={route.name} />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 shrink-0 overflow-y-auto border-r bg-gray-50 p-4">
          <RouteStats
            distanceMeters={route.distanceMeters}
            elevationGainM={route.elevationGainM}
            pointCount={route.routePoints.length}
          />
        </aside>
        <main className="flex-1">
          <DynamicMap trackPoints={route.routePoints} bounds={bounds} />
        </main>
      </div>
    </div>
  );
}
