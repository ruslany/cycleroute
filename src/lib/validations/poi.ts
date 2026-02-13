import { z } from 'zod';

export const POI_CATEGORIES = [
  'FOOD',
  'WATER',
  'RESTROOM',
  'VIEWPOINT',
  'CAUTION',
  'OTHER',
] as const;

export type PoiCategory = (typeof POI_CATEGORIES)[number];

export const createPoiSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  category: z.enum(POI_CATEGORIES),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const updatePoiSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  category: z.enum(POI_CATEGORIES).optional(),
});

export type CreatePoiInput = z.infer<typeof createPoiSchema>;
export type UpdatePoiInput = z.infer<typeof updatePoiSchema>;
