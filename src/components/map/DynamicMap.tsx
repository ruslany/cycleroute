'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type RouteMapComponent from './RouteMap';

const RouteMap = dynamic(() => import('./RouteMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-gray-100">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

type DynamicMapProps = ComponentProps<typeof RouteMapComponent>;

export default function DynamicMap(props: DynamicMapProps) {
  return <RouteMap {...props} />;
}
