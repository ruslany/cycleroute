import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { downloadGpx } from '@/lib/blob';
import { parseGpx } from '@/lib/gpx';
import { weatherRequestSchema } from '@/lib/validations/weather';
import { sampleRoutePoints, fetchOpenMeteoWeather, classifyWind } from '@/lib/weather';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = weatherRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const route = await prisma.route.findUnique({ where: { id } });
    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    const { startTime: startTimeStr, averageSpeedKmh } = parsed.data;
    const startTime = new Date(startTimeStr);

    // Cache check: return existing data if fetched within 30 minutes
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
    const cached = await prisma.weatherData.findMany({
      where: {
        routeId: id,
        plannedStartTime: startTime,
        fetchedAt: { gte: thirtyMinAgo },
      },
      orderBy: { distanceFromStartM: 'asc' },
    });

    if (cached.length > 0) {
      return NextResponse.json({
        points: cached.map((c) => ({
          latitude: c.latitude,
          longitude: c.longitude,
          distanceFromStartM: c.distanceFromStartM,
          estimatedArrivalTime: c.estimatedArrivalTime.toISOString(),
          travelDirectionDeg: c.travelDirectionDeg,
          tempC: c.tempC,
          feelsLikeC: c.feelsLikeC,
          precipProbability: c.precipProbability,
          precipMm: c.precipMm,
          windSpeedKmh: c.windSpeedKmh,
          windGustsKmh: c.windGustsKmh,
          windDirectionDeg: c.windDirectionDeg,
          cloudCoverPercent: c.cloudCoverPercent,
          weatherCode: c.weatherCode,
          windClassification: classifyWind(c.travelDirectionDeg, c.windDirectionDeg),
        })),
        startTime: startTimeStr,
        averageSpeedKmh,
      });
    }

    // Fetch and parse GPX
    const gpxData = await downloadGpx(route.gpxBlobUrl);
    const gpxResult = parseGpx(gpxData);

    // Sample points along route
    const samplePoints = sampleRoutePoints(gpxResult.trackPoints, startTime, averageSpeedKmh);

    if (samplePoints.length === 0) {
      return NextResponse.json({ error: 'Route too short to sample' }, { status: 400 });
    }

    // Fetch weather from Open-Meteo
    const weatherPoints = await fetchOpenMeteoWeather(samplePoints);

    // Delete stale weather data for this route
    await prisma.weatherData.deleteMany({ where: { routeId: id } });

    // Insert new weather data
    await prisma.weatherData.createMany({
      data: weatherPoints.map((wp) => ({
        routeId: id,
        latitude: wp.latitude,
        longitude: wp.longitude,
        distanceFromStartM: wp.distanceFromStartM,
        plannedStartTime: startTime,
        estimatedArrivalTime: wp.estimatedArrivalTime,
        tempC: wp.tempC,
        feelsLikeC: wp.feelsLikeC,
        precipProbability: wp.precipProbability,
        precipMm: wp.precipMm,
        windSpeedKmh: wp.windSpeedKmh,
        windGustsKmh: wp.windGustsKmh,
        windDirectionDeg: wp.windDirectionDeg,
        cloudCoverPercent: wp.cloudCoverPercent,
        weatherCode: wp.weatherCode,
        travelDirectionDeg: wp.travelDirectionDeg,
      })),
    });

    return NextResponse.json({
      points: weatherPoints.map((wp) => ({
        latitude: wp.latitude,
        longitude: wp.longitude,
        distanceFromStartM: wp.distanceFromStartM,
        estimatedArrivalTime: wp.estimatedArrivalTime.toISOString(),
        travelDirectionDeg: wp.travelDirectionDeg,
        tempC: wp.tempC,
        feelsLikeC: wp.feelsLikeC,
        precipProbability: wp.precipProbability,
        precipMm: wp.precipMm,
        windSpeedKmh: wp.windSpeedKmh,
        windGustsKmh: wp.windGustsKmh,
        windDirectionDeg: wp.windDirectionDeg,
        cloudCoverPercent: wp.cloudCoverPercent,
        weatherCode: wp.weatherCode,
        windClassification: wp.windClassification,
      })),
      startTime: startTimeStr,
      averageSpeedKmh,
    });
  } catch (error) {
    console.error('Weather fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 500 });
  }
}
