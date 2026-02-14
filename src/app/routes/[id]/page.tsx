import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { parseGpx } from '@/lib/gpx';
import { downloadGpx } from '@/lib/blob';
import { classifyWind } from '@/lib/weather';
import RouteHeader from '@/components/route-header';
import RouteDetailClient from '@/components/route-detail-client';

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

  // Load cached weather data if available
  const weatherRows = await prisma.weatherData.findMany({
    where: { routeId: id },
    orderBy: { distanceFromStartM: 'asc' },
  });

  let initialWeatherData = null;
  if (weatherRows.length > 0) {
    const firstRow = weatherRows[0];
    const lastRow = weatherRows[weatherRows.length - 1];
    const totalDistKm = lastRow.distanceFromStartM / 1000;
    const totalTimeH =
      (lastRow.estimatedArrivalTime.getTime() - firstRow.plannedStartTime.getTime()) / 3_600_000;
    const averageSpeedKmh = totalTimeH > 0 ? Math.round(totalDistKm / totalTimeH) : 25;

    initialWeatherData = {
      points: weatherRows.map((w) => ({
        latitude: w.latitude,
        longitude: w.longitude,
        distanceFromStartM: w.distanceFromStartM,
        estimatedArrivalTime: w.estimatedArrivalTime.toISOString(),
        travelDirectionDeg: w.travelDirectionDeg,
        tempC: w.tempC,
        feelsLikeC: w.feelsLikeC,
        precipProbability: w.precipProbability,
        precipMm: w.precipMm,
        windSpeedKmh: w.windSpeedKmh,
        windGustsKmh: w.windGustsKmh,
        windDirectionDeg: w.windDirectionDeg,
        cloudCoverPercent: w.cloudCoverPercent,
        weatherCode: w.weatherCode,
        windClassification: classifyWind(w.travelDirectionDeg, w.windDirectionDeg),
      })),
      startTime: firstRow.plannedStartTime.toISOString(),
      averageSpeedKmh,
    };
  }

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
        initialWeatherData={initialWeatherData}
      />
    </div>
  );
}
