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
      <div className="rounded-lg bg-white p-4 shadow">
        <p className="text-sm text-gray-500">Distance</p>
        <p className="text-xl font-semibold">{distanceKm} km</p>
      </div>
      <div className="rounded-lg bg-white p-4 shadow">
        <p className="text-sm text-gray-500">Elevation Gain</p>
        <p className="text-xl font-semibold">
          {elevationGainM !== null ? `${Math.round(elevationGainM)} m` : 'N/A'}
        </p>
      </div>
      <div className="rounded-lg bg-white p-4 shadow">
        <p className="text-sm text-gray-500">Track Points</p>
        <p className="text-xl font-semibold">{pointCount.toLocaleString()}</p>
      </div>
    </div>
  );
}
