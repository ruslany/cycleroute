import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { classifyWind } from '@/lib/weather';
import type { WeatherPanelPoint } from '@/lib/weather';
import WeatherPageClient from '@/components/weather-page-client';

interface WeatherPageProps {
  params: Promise<{ id: string }>;
}

export default async function WeatherPage({ params }: WeatherPageProps) {
  const { id } = await params;

  const route = await prisma.route.findUnique({
    where: { id },
    select: { id: true, name: true, distanceMeters: true },
  });

  if (!route) {
    notFound();
  }

  const weatherRows = await prisma.weatherData.findMany({
    where: { routeId: id },
    orderBy: { distanceFromStartM: 'asc' },
  });

  let initialWeatherData: {
    points: WeatherPanelPoint[];
    startTime: string;
    averageSpeedKmh: number;
  } | null = null;

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
    <WeatherPageClient
      routeId={route.id}
      routeName={route.name}
      distanceMeters={route.distanceMeters}
      initialWeatherData={initialWeatherData}
    />
  );
}
