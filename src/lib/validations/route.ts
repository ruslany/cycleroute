import { z } from "zod";

export const createRouteSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
  gpxData: z.string().min(1, "GPX data is required"),
});

export const updateRouteSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
});

export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;
