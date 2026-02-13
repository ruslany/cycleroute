import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface RouteCardProps {
  id: string;
  name: string;
  distanceMeters: number;
  createdAt: Date;
}

export default function RouteCard({ id, name, distanceMeters, createdAt }: RouteCardProps) {
  const distanceKm = (distanceMeters / 1000).toFixed(1);

  return (
    <Link
      href={`/routes/${id}`}
      className="block rounded-lg bg-card p-4 shadow hover:shadow-md transition-shadow"
    >
      <h3 className="font-semibold text-card-foreground">{name}</h3>
      <div className="mt-1 flex gap-4 text-sm text-muted-foreground">
        <span>{distanceKm} km</span>
        <span>{formatDistanceToNow(createdAt, { addSuffix: true })}</span>
      </div>
    </Link>
  );
}
