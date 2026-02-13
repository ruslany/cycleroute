import type { PoiCategory } from '@/lib/validations/poi';

export interface PoiCategoryConfig {
  label: string;
  color: string;
  icon: string;
}

export const POI_CATEGORY_CONFIG: Record<PoiCategory, PoiCategoryConfig> = {
  FOOD: { label: 'Food', color: '#f97316', icon: 'Utensils' },
  WATER: { label: 'Water', color: '#3b82f6', icon: 'Droplet' },
  RESTROOM: { label: 'Restroom', color: '#8b5cf6', icon: 'DoorOpen' },
  VIEWPOINT: { label: 'Viewpoint', color: '#22c55e', icon: 'Camera' },
  CAUTION: { label: 'Caution', color: '#ef4444', icon: 'AlertTriangle' },
  OTHER: { label: 'Other', color: '#6b7280', icon: 'MapPin' },
};
