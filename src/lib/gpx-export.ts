import type { TrackPoint } from '@/lib/gpx';

interface GpxWaypoint {
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  description?: string;
}

export interface GpxExportOptions {
  name: string;
  description?: string;
  trackPoints: TrackPoint[];
  waypoints: GpxWaypoint[];
}

const GARMIN_TYPE_MAP: Record<string, string> = {
  FOOD: 'FOOD',
  WATER: 'WATER',
  RESTROOM: 'TOILET',
  VIEWPOINT: 'OVERLOOK',
  CAUTION: 'DANGER',
  OTHER: 'GENERIC',
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildExportGpx(options: GpxExportOptions): string {
  const { name, description, trackPoints, waypoints } = options;
  const timestamp = new Date().toISOString();

  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="CycleRoute Planner"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(name)}</name>
    <time>${timestamp}</time>`;

  if (description) {
    gpx += `\n    <desc>${escapeXml(description)}</desc>`;
  }

  gpx += `\n  </metadata>`;

  for (const wpt of waypoints) {
    gpx += `\n  <wpt lat="${wpt.latitude}" lon="${wpt.longitude}">
    <name>${escapeXml(wpt.name)}</name>`;
    if (wpt.description) {
      gpx += `\n    <desc>${escapeXml(wpt.description)}</desc>`;
    }
    gpx += `\n    <type>${escapeXml(GARMIN_TYPE_MAP[wpt.category] ?? wpt.category)}</type>
  </wpt>`;
  }

  gpx += `\n  <trk>
    <name>${escapeXml(name)}</name>
    <trkseg>`;

  for (const pt of trackPoints) {
    gpx += `\n      <trkpt lat="${pt.latitude}" lon="${pt.longitude}">`;
    if (pt.elevation !== null) {
      gpx += `\n        <ele>${pt.elevation}</ele>`;
    }
    gpx += `\n      </trkpt>`;
  }

  gpx += `\n    </trkseg>
  </trk>
</gpx>
`;

  return gpx;
}
