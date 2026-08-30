import * as Location from 'expo-location';
import { Coordinates } from './distance';

export interface PlaceResult {
  id:          string;
  name:        string;
  address:     string;
  coordinates: Coordinates;
}

export interface GeocodingProvider {
  search(query: string): Promise<PlaceResult[]>;
  reverse(coords: Coordinates): Promise<PlaceResult | null>;
}

const MAX_RESULTS = 5;

// expo-location returns no stable identifier, so derive one from the position.
function idFor(coords: Coordinates): string {
  return `${coords.latitude.toFixed(6)},${coords.longitude.toFixed(6)}`;
}

// Short label for the result row — the most specific thing we know.
function nameFor(a: Location.LocationGeocodedAddress): string {
  return a.name || a.street || a.district || a.city || a.region || 'Selected Location';
}

// Full single-line address for the secondary row.
function addressFor(a: Location.LocationGeocodedAddress): string {
  const street = [a.streetNumber, a.street].filter(Boolean).join(' ');
  const parts = [a.name, street, a.district, a.city, a.region, a.postalCode, a.country];

  const seen = new Set<string>();
  return parts
    .filter((p): p is string => Boolean(p))
    .filter(p => {
      const key = p.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(', ');
}

function fallback(coords: Coordinates): PlaceResult {
  return {
    id:      idFor(coords),
    name:    'Selected Location',
    address: `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
    coordinates: coords,
  };
}

const nativeGeocoder: GeocodingProvider = {
  async search(query: string): Promise<PlaceResult[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    const matches = await Location.geocodeAsync(trimmed);
    if (!matches.length) return [];

    const [first, ...rest] = matches.slice(0, MAX_RESULTS);
    const firstCoords = { latitude: first.latitude, longitude: first.longitude };

    // geocodeAsync yields coordinates without labels, so the top hit is named by
    // reversing it — but only the top hit. Reversing every result meant up to
    // five extra calls per keystroke burst, issued concurrently, which is the
    // exact pattern the platform geocoders throttle. Whichever result the user
    // picks is labelled properly on selection instead, which is one call on a
    // deliberate action rather than five on every keystroke.
    let head: PlaceResult;
    try {
      head = (await nativeGeocoder.reverse(firstCoords)) ?? { ...fallback(firstCoords), name: trimmed };
    } catch {
      head = { ...fallback(firstCoords), name: trimmed };
    }

    return [
      head,
      ...rest.map((m) => {
        const coords = { latitude: m.latitude, longitude: m.longitude };
        return { ...fallback(coords), name: trimmed };
      }),
    ];
  },

  async reverse(coords: Coordinates): Promise<PlaceResult | null> {
    const [match] = await Location.reverseGeocodeAsync(coords);
    if (!match) return null;

    return {
      id:      idFor(coords),
      name:    nameFor(match),
      address: addressFor(match) || fallback(coords).address,
      coordinates: coords,
    };
  },
};

// Swap a Google Places implementation in here — nothing else changes.
export const geocoder: GeocodingProvider = nativeGeocoder;
