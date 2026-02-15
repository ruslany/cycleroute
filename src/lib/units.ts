const KM_PER_MILE = 1.60934;
const FEET_PER_METER = 3.28084;

export function metersToKm(m: number): number {
  return m / 1000;
}

export function metersToMiles(m: number): number {
  return m / 1000 / KM_PER_MILE;
}

export function metersToFeet(m: number): number {
  return m * FEET_PER_METER;
}

export function celsiusToFahrenheit(c: number): number {
  return c * 1.8 + 32;
}

export function kmhToMph(kmh: number): number {
  return kmh / KM_PER_MILE;
}

export function formatDistance(meters: number, imperial: boolean): string {
  if (imperial) {
    return `${metersToMiles(meters).toFixed(1)} mi`;
  }
  return `${metersToKm(meters).toFixed(1)} km`;
}

export function formatDistanceRound(meters: number, imperial: boolean): string {
  if (imperial) {
    return `${Math.round(metersToMiles(meters))} mi`;
  }
  return `${Math.round(metersToKm(meters))} km`;
}

export function formatSpeed(kmh: number, imperial: boolean): string {
  if (imperial) {
    return `${kmhToMph(kmh).toFixed(1)} mph`;
  }
  return `${kmh} km/h`;
}

export function formatTemp(celsius: number, imperial: boolean): string {
  if (imperial) {
    return `${Math.round(celsiusToFahrenheit(celsius))}°F`;
  }
  return `${Math.round(celsius)}°C`;
}

export function formatElevation(meters: number, imperial: boolean): string {
  if (imperial) {
    return `${Math.round(metersToFeet(meters))} ft`;
  }
  return `${Math.round(meters)} m`;
}

export function distanceUnit(imperial: boolean): string {
  return imperial ? 'mi' : 'km';
}

export function tempUnit(imperial: boolean): string {
  return imperial ? '°F' : '°C';
}

export function speedUnit(imperial: boolean): string {
  return imperial ? ' mph' : ' km/h';
}

export function elevationUnit(imperial: boolean): string {
  return imperial ? 'ft' : 'm';
}
