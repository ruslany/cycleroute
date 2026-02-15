import { prisma } from '@/lib/prisma';
import GpxUploader from '@/components/gpx-uploader';
import RouteCard from '@/components/route-card';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const routes = await prisma.route.findMany({
    select: {
      id: true,
      name: true,
      distanceMeters: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">My Routes</h1>
          <GpxUploader />
        </div>

        <div className="mt-8 space-y-4">
          {routes.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No routes yet. Upload a GPX file to get started.
            </p>
          ) : (
            routes.map((route) => (
              <RouteCard
                key={route.id}
                id={route.id}
                name={route.name}
                distanceMeters={route.distanceMeters}
                createdAt={route.createdAt}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
