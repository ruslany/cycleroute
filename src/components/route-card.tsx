'use client';

import Link from 'next/link';
import { Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import DeleteRouteButton from '@/components/delete-route-button';

interface RouteCardProps {
  id: string;
  name: string;
  distanceMeters: number;
  createdAt: Date;
}

export default function RouteCard({ id, name, distanceMeters, createdAt }: RouteCardProps) {
  const distanceKm = (distanceMeters / 1000).toFixed(1);

  return (
    <div className="flex items-center justify-between rounded-lg bg-card p-4 shadow hover:shadow-md transition-shadow">
      <Link href={`/routes/${id}`} className="flex-1">
        <h3 className="font-semibold text-card-foreground">{name}</h3>
        <div className="mt-1 flex gap-4 text-sm text-muted-foreground">
          <span>{distanceKm} km</span>
          <span>{formatDistanceToNow(createdAt, { addSuffix: true })}</span>
        </div>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-foreground"
        asChild
        onClick={(e) => e.stopPropagation()}
      >
        <a href={`/api/routes/${id}/export`} download>
          <Download className="size-4" />
        </a>
      </Button>
      <DeleteRouteButton id={id} name={name} />
    </div>
  );
}
