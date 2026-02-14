# CycleRoute Planner - Requirements Document

## Project Overview

A web application for cyclists to prepare routes with weather forecasting, POI management, and cue sheet generation. The app allows users to upload GPX tracks, enhance them with points of interest and turn-by-turn directions, view weather conditions along the route, and export enhanced GPX files compatible with Wahoo cycling computers.

## Target User

- Primary: The developer (personal use for cycling route planning)
- Secondary: Cycling friends who may benefit from the same features
- Assumed technical comfort level: Can handle file uploads/downloads, familiar with GPX files

## Tech Stack

### Frontend & Backend
- **Framework**: Next.js 16.x (App Router) - latest stable version with Turbopack as default bundler
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **ORM**: Prisma 7.x - latest stable version with Rust-free client
- **Database**: PostgreSQL for both local development and production
- **File Storage**: Vercel Blob for GPX file storage (keeps database lightweight)

### Mapping
- **Map Library**: Leaflet with React-Leaflet
  - Free, open-source, well-documented
  - Good TypeScript support
  - Large ecosystem of plugins
- **Map Tiles**: OpenStreetMap (free) or Mapbox (if you want nicer styling, has free tier)
- **Routing Engine**: OSRM (Open Source Routing Machine)
  - Public demo server available for development: `https://router.project-osrm.org`
  - Can self-host later if needed
  - Returns turn-by-turn directions with each route request
  - Alternative: BRouter for cycling-specific routing profiles

### Weather
- **Weather API**: Open-Meteo
  - Free, no API key required for basic use
  - Hourly forecasts
  - Supports location-based queries
  - Good coverage globally

### GPX Parsing
- **Library**: `gpxparser` or `@tmcw/togeojson` for parsing
- Custom serialization for GPX output (to ensure Wahoo compatibility)

---

## Core Features (MVP)

### Feature 1: GPX Upload & Visualization

**Description**: User can upload a GPX file and see it displayed on an interactive map.

**Requirements**:
- Accept `.gpx` file uploads via drag-and-drop or file picker
- Parse GPX track points and display as a polyline on the map
- Show basic route stats: total distance, elevation gain (if available in GPX)
- Auto-fit map bounds to show entire route
- Display elevation profile below the map (stretch goal for MVP)

**Technical Notes**:
- Store original GPX files in Vercel Blob storage; save the blob URL in the database
- Parse GPX on-the-fly from blob when displaying route details
- Parse GPX to GeoJSON for Leaflet display
- Handle both `<trk>` (tracks) and `<rte>` (routes) GPX elements
- Delete blob when route is deleted

### Feature 2: Point of Interest (POI) Management

**Description**: User can add, edit, and remove points of interest along the route.

**Requirements**:
- Click on map to add a POI
- POI types with icons:
  - Food/Restaurant
  - Water/Refill
  - Restroom
  - Viewpoint/Photo op
  - Caution/Hazard
  - Custom/Other
- Edit POI: change name, type, add notes
- Delete POI
- POIs snap to nearest point on route (optional, nice-to-have)
- Show POIs in a sidebar list with distance from start

**Technical Notes**:
- Store POIs as waypoints (`<wpt>`) in GPX export
- Use appropriate symbol names that Wahoo recognizes (test required)

### Feature 3: Route Retracing with Cue Sheet Generation

**Description**: User can create a routable course from a recorded track by clicking waypoints that snap to roads, generating turn-by-turn directions.

**Requirements**:
- Display uploaded GPX track as a reference layer (semi-transparent)
- User clicks points along/near the track to define route waypoints
- Each segment between waypoints is routed via OSRM
- Routing uses bicycle profile
- Turn-by-turn directions are automatically generated from routing response
- Show generated cue sheet in sidebar:
  - Turn type (left, right, straight, etc.)
  - Street name (when available)
  - Distance to next turn
- Allow user to:
  - Drag intermediate points to adjust route
  - Delete waypoints
  - Insert waypoints between existing ones
- Undo/redo support (nice-to-have for MVP)

**Technical Notes**:
- OSRM `/route/v1/bike/` endpoint returns `steps` with turn instructions
- Map OSRM maneuver types to GPX course point types
- Store both the reference track and the generated route

### Feature 4: Weather Overlay

**Description**: Show weather conditions along the route based on a planned start time.

**Requirements**:
- User selects planned start date and time
- Calculate estimated time at points along the route (based on average speed input)
- Fetch weather forecast for multiple points along the route
- Display weather info:
  - Temperature (actual and feels-like)
  - Precipitation probability and amount
  - Wind speed and direction
  - Wind relative to direction of travel (headwind/tailwind/crosswind indicator)
- Visual timeline or route coloring showing conditions
- "Best start time" suggestion (stretch goal)

**Technical Notes**:
- Sample weather at reasonable intervals (e.g., every 20km or every hour of riding)
- Cache weather data to avoid excessive API calls
- Open-Meteo allows up to 10,000 requests/day on free tier

### Feature 5: GPX Export

**Description**: Export the enhanced route as a GPX file compatible with Wahoo devices.

**Requirements**:
- Export includes:
  - Route track (`<trk>` or `<rte>`)
  - Waypoints for POIs (`<wpt>`)
  - Course points for turn-by-turn cues (Garmin/Wahoo extensions)
- File downloads with sensible filename (route name + date)
- Validate export works on Wahoo ELEMNT (manual testing)

**Technical Notes**:
- GPX course points use Garmin extensions:
```xml
<gpx xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3">
  <trk>
    <trkseg>
      <!-- track points -->
    </trkseg>
  </trk>
  <extensions>
    <gpxx:CourseExtension>
      <gpxx:CoursePoint>
        <gpxx:Name>Turn right onto Main St</gpxx:Name>
        <gpxx:Time>2024-01-15T10:30:00Z</gpxx:Time>
        <gpxx:Position>
          <gpxx:LatitudeDegrees>47.6062</gpxx:LatitudeDegrees>
          <gpxx:LongitudeDegrees>-122.3321</gpxx:LongitudeDegrees>
        </gpxx:Position>
        <gpxx:PointType>Right</gpxx:PointType>
      </gpxx:CoursePoint>
    </gpxx:CourseExtension>
  </extensions>
</gpx>
```
- Test with actual Wahoo device to confirm format

---

## Data Model

### Route
```prisma
model Route {
  id            String    @id @default(cuid())
  name          String
  description   String?
  gpxBlobUrl    String    // URL to GPX file in Vercel Blob storage
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Computed/cached values
  distanceMeters    Float?
  elevationGainM    Float?

  // Relations
  pois          POI[]
  cuePoints     CuePoint[]
  weatherData   WeatherData[]
}

model POI {
  id        String  @id @default(cuid())
  routeId   String
  route     Route   @relation(fields: [routeId], references: [id], onDelete: Cascade)
  
  name      String
  type      POIType
  notes     String?
  lat       Float
  lon       Float
  
  distanceFromStartM  Float?  // Calculated distance along route
}

enum POIType {
  FOOD
  WATER
  RESTROOM
  VIEWPOINT
  CAUTION
  OTHER
}

model CuePoint {
  id        String  @id @default(cuid())
  routeId   String
  route     Route   @relation(fields: [routeId], references: [id], onDelete: Cascade)
  
  sequence  Int
  lat       Float
  lon       Float
  
  maneuverType    String    // Right, Left, Straight, etc.
  instruction     String    // "Turn right onto Main St"
  distanceFromStartM  Float
  distanceToNextM     Float?
}

model WeatherData {
  id        String  @id @default(cuid())
  routeId   String
  route     Route   @relation(fields: [routeId], references: [id], onDelete: Cascade)
  
  lat       Float
  lon       Float
  distanceFromStartM  Float
  
  // Planned timing
  plannedStartTime    DateTime
  estimatedArrivalTime DateTime
  
  // Weather conditions
  tempC               Float
  feelsLikeC          Float
  precipProbability   Float
  precipMm            Float
  windSpeedKmh        Float
  windDirectionDeg    Int
  weatherCode         Int       // WMO weather code
  
  fetchedAt           DateTime  @default(now())
  
  @@index([routeId, plannedStartTime])
}
```

---

## API Endpoints

### Routes
- `POST /api/routes` - Create new route (upload GPX)
- `GET /api/routes` - List all routes
- `GET /api/routes/[id]` - Get route details
- `PUT /api/routes/[id]` - Update route (name, description)
- `DELETE /api/routes/[id]` - Delete route

### POIs
- `POST /api/routes/[id]/pois` - Add POI to route
- `PUT /api/routes/[id]/pois/[poiId]` - Update POI
- `DELETE /api/routes/[id]/pois/[poiId]` - Delete POI

### Routing (Cue Sheet Generation)
- `POST /api/routes/[id]/retrace` - Generate routed course from waypoints
  - Body: `{ waypoints: [{lat, lon}, ...], profile: 'bike' }`
  - Calls OSRM, stores route points and cue points

### Weather
- `POST /api/routes/[id]/weather` - Fetch weather for planned ride
  - Body: `{ startTime: ISO8601, averageSpeedKmh: number }`
  - Returns weather data for points along route

### Export
- `GET /api/routes/[id]/export.gpx` - Download enhanced GPX file

---

## UI/UX Design

### Pages

#### Home / Route List (`/`)
- List of saved routes with basic info (name, distance, date)
- "New Route" button
- Click route to open editor

#### Route Editor (`/routes/[id]`)
- **Main area**: Full-width map
- **Left sidebar** (collapsible):
  - Route info (name, distance, elevation)
  - POI list
  - Cue sheet
- **Right panel** or **bottom drawer**:
  - Weather timeline (when viewing weather)
  - Elevation profile
- **Toolbar** (top or floating):
  - Mode toggle: View / Add POI / Retrace Route
  - Weather button (opens time picker)
  - Export button

### Map Interactions

| Mode | Click Behavior | Cursor |
|------|----------------|--------|
| View | Pan/zoom only | Default |
| Add POI | Add POI at click location | Crosshair + POI icon |
| Retrace | Add routing waypoint | Crosshair + route icon |

### Responsive Considerations
- Primary use: Desktop (route planning on big screen)
- Mobile: Should work for viewing and minor edits
- Export flow designed for "plan on desktop, export on phone" workflow

---

## External Service Integration

### OSRM (Routing)
- **Endpoint**: `https://router.project-osrm.org/route/v1/bike/{coordinates}`
- **Rate limits**: Public server has limits; be respectful
- **Fallback**: Consider caching routes or self-hosting for production

### Open-Meteo (Weather)
- **Endpoint**: `https://api.open-meteo.com/v1/forecast`
- **Parameters needed**:
  - `latitude`, `longitude`
  - `hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,wind_speed_10m,wind_direction_10m,weather_code`
  - `timezone=auto`
- **No API key required** for basic use

### Map Tiles
- **OpenStreetMap**: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- **Attribution required**: "© OpenStreetMap contributors"
- **Alternative**: Mapbox, Stadia Maps, or other providers for different styles

---

## Development Phases

### Phase 1: Foundation (Week 1)
- [ ] Project setup (Next.js, Prisma, Tailwind)
- [ ] Database schema and migrations
- [ ] Basic GPX parsing utility
- [ ] Map component with tile layer
- [ ] GPX upload and display on map
- [ ] Route CRUD API

### Phase 2: POI Management (Week 2)
- [ ] POI data model and API
- [ ] Add POI mode in map UI
- [ ] POI sidebar list
- [ ] Edit/delete POI
- [ ] POI icons on map

### Phase 3: GPX Export (Week 3)
- [ ] GPX serialization with extensions
- [ ] Export API endpoint
- [ ] Download flow
- [ ] **Test with Wahoo device**

### Phase 4: Weather Integration (Week 4)
- [ ] Open-Meteo integration
- [ ] Weather data model and caching
- [ ] Start time picker UI
- [ ] Weather display (timeline/route coloring)
- [ ] Wind direction relative to travel

### Phase 5: Route Retracing (Week 5)
- [ ] OSRM integration
- [ ] Retrace mode UI
- [ ] Waypoint placement and routing
- [ ] Cue sheet extraction and display
- [ ] Waypoint drag-to-adjust

### Phase 6: Polish & Nice-to-haves
- [ ] Elevation profile display
- [ ] Undo/redo for route editing
- [ ] Best start time suggestion
- [ ] Improved mobile experience
- [ ] User accounts (if sharing with friends)

---

## Testing Checklist

### GPX Compatibility
- [ ] Import GPX from various sources (Strava, Garmin, RideWithGPS, Wahoo)
- [ ] Export GPX imports correctly to Wahoo ELEMNT
- [ ] POIs appear as waypoints on Wahoo
- [ ] Cue sheet directions appear and trigger on Wahoo
- [ ] Test with real ride

### Edge Cases
- [ ] Very long routes (200+ km)
- [ ] Routes with many track points
- [ ] GPX files with missing elevation data
- [ ] Routes that cross timezones
- [ ] Weather API failures (graceful degradation)

---

## Future Feature Ideas (Post-MVP)

- User accounts and route sharing
- Dropbox integration for auto-sync to Wahoo
- Surface type warnings (gravel, unpaved)
- Cafe/shop database integration
- Bail-out points (train stations)
- Route comparison (overlay multiple routes)
- Strava segment integration
- Social features (group ride planning)
- Mobile app wrapper (PWA or React Native)

---

## Environment Variables

```env
# Database (PostgreSQL for both local dev and production)
DATABASE_URL="postgresql://user:password@localhost:5432/cycleroute"

# Vercel Blob storage (required for GPX file storage)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxx"

# Optional: Mapbox (if using instead of OSM)
NEXT_PUBLIC_MAPBOX_TOKEN="pk.xxx"

# Optional: Self-hosted OSRM
OSRM_SERVER_URL="https://router.project-osrm.org"

# Open-Meteo (no key needed, but good to have configurable)
WEATHER_API_URL="https://api.open-meteo.com/v1/forecast"
```

### Local PostgreSQL Setup

Create the database on your local PostgreSQL instance (Ubuntu WSL):

```bash
# Connect to PostgreSQL and create database
sudo -u postgres psql -c "CREATE DATABASE cycleroute;"

# Optionally create a dedicated user
sudo -u postgres psql -c "CREATE USER cycleroute WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE cycleroute TO cycleroute;"
```

Connection string for local dev:
```
DATABASE_URL="postgresql://cycleroute:your_password@localhost:5432/cycleroute"
```

---

## Getting Started Commands

```bash
# Create Next.js 16 project
npx create-next-app@latest cycleroute --typescript --tailwind --app --src-dir

# Install dependencies
npm install prisma@latest @prisma/client@latest
npm install leaflet react-leaflet @types/leaflet
npm install @vercel/blob       # Blob storage for GPX files
npm install @tmcw/togeojson    # GPX parsing
npm install date-fns           # Date handling
npm install zod                # Validation

# Initialize Prisma with PostgreSQL
npx prisma init --datasource-provider postgresql

# After adding schema, run migrations
npx prisma migrate dev --name init
```

### Prisma 7 Notes

Prisma 7 uses a new Rust-free client by default. Key changes:
- Use `prisma-client` provider instead of `prisma-client-js` in schema
- Generated client requires an `output` path in schema
- Configuration can be done via `prisma.config.ts` file

Example schema header for Prisma 7:
```prisma
generator client {
  provider = "prisma-client"
  output   = "./generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## Reference Links

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16)
- [Leaflet Documentation](https://leafletjs.com/)
- [React-Leaflet](https://react-leaflet.js.org/)
- [Prisma 7 Documentation](https://www.prisma.io/docs)
- [Prisma 7 Upgrade Guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions)
- [OSRM API Documentation](https://project-osrm.org/docs/v5.24.0/api/)
- [Open-Meteo API](https://open-meteo.com/en/docs)
- [GPX 1.1 Schema](https://www.topografix.com/gpx.asp)
- [Garmin GPX Extensions](https://www8.garmin.com/xmlschemas/GpxExtensionsv3.xsd)
- [Wahoo ELEMNT Support](https://support.wahoofitness.com/)
