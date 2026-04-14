export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Haversine formula — accurate GPS distance in metres
export function getDistanceMetres(a: Coordinates, b: Coordinates): number {
  const R    = 6371000; // Earth radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat  = toRad(b.latitude  - a.latitude);
  const dLon  = toRad(b.longitude - a.longitude);

  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);

  const haversine =
    sinLat * sinLat +
    Math.cos(toRad(a.latitude)) *
    Math.cos(toRad(b.latitude)) *
    sinLon * sinLon;

  const c = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return R * c;
}

// Human-friendly distance label
export function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)}m away`;
  return `${(metres / 1000).toFixed(1)}km away`;
}

// Check if user is inside a geofence radius
export function isInsideRadius(
  userLocation: Coordinates,
  target: Coordinates,
  radiusMetres: number
): boolean {
  return getDistanceMetres(userLocation, target) <= radiusMetres;
}