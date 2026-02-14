'use client';

import { useState, useCallback } from 'react';
import { Download, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RouteStats from '@/components/route-stats';
import PoiList from '@/components/poi-list';
import PoiForm from '@/components/poi-form';
import DynamicMap from '@/components/map/dynamic-map';
import type { PoiData } from '@/components/map/route-map';
import type { PoiCategory } from '@/lib/validations/poi';

interface RouteDetailClientProps {
  routeId: string;
  distanceMeters: number;
  elevationGainM: number | null;
  pointCount: number;
  trackPoints: { latitude: number; longitude: number }[];
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number };
  initialPois: PoiData[];
}

export default function RouteDetailClient({
  routeId,
  distanceMeters,
  elevationGainM,
  pointCount,
  trackPoints,
  bounds,
  initialPois,
}: RouteDetailClientProps) {
  const [pois, setPois] = useState<PoiData[]>(initialPois);
  const [isAddingPoi, setIsAddingPoi] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [editingPoi, setEditingPoi] = useState<PoiData | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPendingLocation({ lat, lng });
    setEditingPoi(null);
    setFormOpen(true);
    setIsAddingPoi(false);
  }, []);

  const handleCreatePoi = async (values: {
    name: string;
    category: PoiCategory;
    description: string;
  }) => {
    if (!pendingLocation) return;

    const res = await fetch(`/api/routes/${routeId}/pois`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...values,
        latitude: pendingLocation.lat,
        longitude: pendingLocation.lng,
      }),
    });

    if (res.ok) {
      const poi = await res.json();
      setPois((prev) => [...prev, poi]);
      setFormOpen(false);
      setPendingLocation(null);
    }
  };

  const handleEditPoi = (poi: PoiData) => {
    setEditingPoi(poi);
    setPendingLocation(null);
    setFormOpen(true);
  };

  const handleUpdatePoi = async (values: {
    name: string;
    category: PoiCategory;
    description: string;
  }) => {
    if (!editingPoi) return;

    const res = await fetch(`/api/routes/${routeId}/pois/${editingPoi.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    if (res.ok) {
      const updated = await res.json();
      setPois((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setFormOpen(false);
      setEditingPoi(null);
    }
  };

  const handleDeletePoi = async (poiId: string) => {
    const res = await fetch(`/api/routes/${routeId}/pois/${poiId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setPois((prev) => prev.filter((p) => p.id !== poiId));
    }
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setPendingLocation(null);
      setEditingPoi(null);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="w-80 shrink-0 overflow-y-auto border-r border-border bg-muted p-4">
        <RouteStats
          distanceMeters={distanceMeters}
          elevationGainM={elevationGainM}
          pointCount={pointCount}
        />
        <div className="mt-4">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <a href={`/api/routes/${routeId}/export`} download>
              <Download size={14} className="mr-2" />
              Download GPX
            </a>
          </Button>
        </div>
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Points of Interest</h3>
            <Button
              variant={isAddingPoi ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setIsAddingPoi(!isAddingPoi)}
            >
              {isAddingPoi ? (
                <>
                  <X size={14} className="mr-1" /> Cancel
                </>
              ) : (
                <>
                  <Plus size={14} className="mr-1" /> Add POI
                </>
              )}
            </Button>
          </div>
          {isAddingPoi && (
            <p className="mb-3 text-xs text-muted-foreground">Click on the map to place a POI.</p>
          )}
          <PoiList
            pois={pois}
            trackPoints={trackPoints}
            onEdit={handleEditPoi}
            onDelete={handleDeletePoi}
          />
        </div>
      </aside>
      <main className="flex-1">
        <DynamicMap
          trackPoints={trackPoints}
          bounds={bounds}
          pois={pois}
          isAddingPoi={isAddingPoi}
          onMapClick={handleMapClick}
        />
      </main>

      <PoiForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        onSubmit={editingPoi ? handleUpdatePoi : handleCreatePoi}
        initialValues={
          editingPoi
            ? {
                name: editingPoi.name,
                category: editingPoi.category as PoiCategory,
                description: editingPoi.description ?? '',
              }
            : undefined
        }
        title={editingPoi ? 'Edit POI' : 'Add POI'}
        key={editingPoi?.id ?? 'new'}
      />
    </div>
  );
}
