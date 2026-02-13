'use client';

import { useState } from 'react';
import {
  Utensils,
  Droplet,
  DoorOpen,
  Camera,
  AlertTriangle,
  MapPin,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { POI_CATEGORY_CONFIG } from '@/lib/poi-categories';
import { distanceAlongTrack } from '@/lib/geo';
import type { PoiCategory } from '@/lib/validations/poi';

const CATEGORY_ICONS = {
  FOOD: Utensils,
  WATER: Droplet,
  RESTROOM: DoorOpen,
  VIEWPOINT: Camera,
  CAUTION: AlertTriangle,
  OTHER: MapPin,
} as const;

interface Poi {
  id: string;
  name: string;
  description: string | null;
  category: string;
  latitude: number;
  longitude: number;
}

interface PoiListProps {
  pois: Poi[];
  trackPoints: { latitude: number; longitude: number }[];
  onEdit: (poi: Poi) => void;
  onDelete: (poiId: string) => void;
}

export default function PoiList({ pois, trackPoints, onEdit, onDelete }: PoiListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const poisWithDistance = pois
    .map((poi) => ({
      ...poi,
      distance: distanceAlongTrack(trackPoints, {
        latitude: poi.latitude,
        longitude: poi.longitude,
      }),
    }))
    .sort((a, b) => a.distance - b.distance);

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  if (poisWithDistance.length === 0) {
    return <p className="text-sm text-muted-foreground">No points of interest yet.</p>;
  }

  return (
    <>
      <div className="space-y-2">
        {poisWithDistance.map((poi) => {
          const category = poi.category as PoiCategory;
          const config = POI_CATEGORY_CONFIG[category] ?? POI_CATEGORY_CONFIG.OTHER;
          const Icon = CATEGORY_ICONS[category] ?? MapPin;
          const distKm = (poi.distance / 1000).toFixed(1);

          return (
            <div key={poi.id} className="flex items-start gap-3 rounded-lg bg-card p-3 shadow-sm">
              <div className="mt-0.5 shrink-0" style={{ color: config.color }}>
                <Icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-sm">{poi.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{distKm} km</span>
                </div>
                {poi.description && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{poi.description}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(poi)}>
                  <Pencil size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => setDeleteId(poi.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete POI</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this point of interest? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
