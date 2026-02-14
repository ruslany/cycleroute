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
  const distanceKm = (distanceMeters / 1000).toFixed(1);

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="rounded-lg bg-card p-4 shadow">
        <p className="text-sm text-muted-foreground">Distance</p>
        <p className="text-xl font-semibold">{distanceKm} km</p>
      </div>
      <div className="rounded-lg bg-card p-4 shadow">
        <p className="text-sm text-muted-foreground">Elevation Gain</p>
        <p className="text-xl font-semibold">
          {elevationGainM !== null ? `${Math.round(elevationGainM)} m` : 'N/A'}
        </p>
      </div>
      <div className="rounded-lg bg-card p-4 shadow">
        <p className="text-sm text-muted-foreground">Track Points</p>
        <p className="text-xl font-semibold">{pointCount.toLocaleString()}</p>
      </div>
    </div>
  );
}
