# CycleRoute Planner

A web app for cyclists to upload, visualize, and manage cycling routes from GPX files.

## Tech Stack

- **Framework:** Next.js 16 (App Router) with React 19 and TypeScript
- **Database:** PostgreSQL with Prisma 7 ORM (Rust-free client, `@prisma/adapter-pg`)
- **Mapping:** Leaflet + react-leaflet with OpenStreetMap tiles
- **Styling:** Tailwind CSS 4, shadcn/ui (new-york style), next-themes for dark/light mode
- **GPX parsing:** @tmcw/togeojson + @xmldom/xmldom
- **Validation:** Zod

## Project Structure

- `src/app/` - Next.js App Router pages and API routes
  - `page.tsx` - Home page with route list
  - `routes/[id]/page.tsx` - Route detail/editor page
  - `api/routes/` - REST API (CRUD for routes)
- `src/components/` - React components (GpxUploader, RouteCard, RouteHeader, RouteStats, map/)
- `src/lib/` - Shared utilities (gpx parsing, prisma client, zod validations)
- `prisma/` - Schema and migrations

## Commands

- `npm run dev` - Start dev server (Turbopack)
- `npm run build` - Production build
- `npm run lint` - ESLint
- `npm run format` - Prettier format
- `npx prisma generate` - Generate Prisma client (required before build/typecheck)
- `npx prisma migrate dev` - Run database migrations
- `npx tsc --noEmit` - Type check

## Code Style

- Prettier: single quotes, semicolons, trailing commas, 2-space indent, 100 char width
- ESLint: next/core-web-vitals + next/typescript
- Path alias: `@/*` maps to `src/*`
- Server components for data fetching, client components for interactivity
