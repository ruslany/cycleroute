import { z } from 'zod';

export const weatherRequestSchema = z.object({
  startTime: z.string().datetime({ message: 'Must be a valid ISO 8601 date/time' }),
  averageSpeedKmh: z
    .number()
    .min(5, 'Speed must be at least 5 km/h')
    .max(60, 'Speed must be at most 60 km/h'),
});

export type WeatherRequestInput = z.infer<typeof weatherRequestSchema>;
