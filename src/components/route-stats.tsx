'use client';

import { useUnits } from '@/components/units-provider';
import { formatDistance, formatElevation } from '@/lib/units';

interface RouteStatsProps {
  distanceMeters: number;
  elevationGainM: number | null;
  pointCount: number;
}

export default function RouteStats({
  distanceMeters,
  elevationGainM,
  pointCount,
}: RouteStatsProps) {
  const { imperial } = useUnits();

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-4">
      <div className="rounded-lg bg-card p-4 shadow">
        <p className="text-sm text-muted-foreground">Distance</p>
        <p className="text-xl font-semibold">{formatDistance(distanceMeters, imperial)}</p>
      </div>
      <div className="rounded-lg bg-card p-4 shadow">
        <p className="text-sm text-muted-foreground">Elevation Gain</p>
        <p className="text-xl font-semibold">
          {elevationGainM !== null ? formatElevation(elevationGainM, imperial) : 'N/A'}
        </p>
      </div>
      <div className="rounded-lg bg-card p-4 shadow">
        <p className="text-sm text-muted-foreground">Track Points</p>
        <p className="text-xl font-semibold">{pointCount.toLocaleString()}</p>
      </div>
    </div>
  );
}
