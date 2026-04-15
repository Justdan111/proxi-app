import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import ReminderMap from '@/components/maps/ReminderMap';
import { Coordinates } from '@/lib/location/distance';

const GOOGLE_PLACES_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY;

interface PlacePrediction {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

export default function LocationPickerScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlacePrediction[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Coordinates | null>(null);
  const [address, setAddress] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationPermissionMessage, setLocationPermissionMessage] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const initCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationPermissionMessage('Location permission denied. You can still search or tap the map to choose a location.');
          return;
        }

        setLocationPermissionMessage('');

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };

        setSelected(coords);

        const reverse = await Location.reverseGeocodeAsync(coords);
        const place = reverse[0];
        if (place) {
          const name = place.name || place.street || 'Current Location';
          const formattedAddress = [place.street, place.city, place.country].filter(Boolean).join(', ');
          setLocationName(name);
          setAddress(formattedAddress || name);
          setQuery(name);
        }
      } catch {
        // Keep picker usable even if location lookup fails.
        setLocationPermissionMessage('Unable to access your current location. Search or tap the map to continue.');
      }
    };

    void initCurrentLocation();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const searchPlaces = useCallback(async (text: string) => {
    if (text.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    if (!GOOGLE_PLACES_KEY) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    try {
      const url =
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
        `input=${encodeURIComponent(text)}&key=${GOOGLE_PLACES_KEY}&language=en`;

      const res = await fetch(url);
      const json = await res.json();

      const predictions = (json.predictions || []).map((p: any) => ({
        place_id: p.place_id,
        description: p.description,
        main_text: p.structured_formatting?.main_text ?? p.description,
        secondary_text: p.structured_formatting?.secondary_text ?? '',
      }));

      setResults(predictions);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleQueryChange = (text: string) => {
    setQuery(text);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void searchPlaces(text);
    }, 400);
  };

  const selectPlace = async (place: PlacePrediction) => {
    setQuery(place.main_text);
    setResults([]);
    setLocationName(place.main_text);
    setAddress(place.description);

    if (!GOOGLE_PLACES_KEY) return;

    try {
      const url =
        `https://maps.googleapis.com/maps/api/place/details/json?` +
        `place_id=${place.place_id}&fields=geometry&key=${GOOGLE_PLACES_KEY}`;

      const res = await fetch(url);
      const json = await res.json();
      const loc = json.result?.geometry?.location;

      if (loc) {
        setSelected({ latitude: loc.lat, longitude: loc.lng });
      }
    } catch {
      // Keep selection text even if details call fails.
    }
  };

  const handleMapTap = async (coords: Coordinates) => {
    setSelected(coords);
    setResults([]);
    setLocationPermissionMessage('');

    try {
      const reverse = await Location.reverseGeocodeAsync(coords);
      const place = reverse[0];

      if (place) {
        const name = place.name || place.street || 'Selected Location';
        const addr = [place.street, place.city, place.country].filter(Boolean).join(', ');

        setLocationName(name);
        setAddress(addr || name);
        setQuery(name);
      }
    } catch {
      // Allow manual map selection even if reverse geocoding fails.
      setLocationName('Selected Location');
      setAddress('');
      setQuery('Selected Location');
    }
  };

  const confirmSelection = () => {
    if (!selected) return;

    router.push({
      pathname: '/add-reminder',
      params: {
        selectedLat: String(selected.latitude),
        selectedLon: String(selected.longitude),
        selectedAddress: address,
        selectedLocation: locationName || query || 'Selected Location',
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {locationPermissionMessage ? (
        <View style={styles.permissionBanner}>
          <Text style={styles.permissionText}>{locationPermissionMessage}</Text>
          <TouchableOpacity
            onPress={() => {
              setLocationPermissionMessage('');
              void (async () => {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                  setLocationPermissionMessage('Location permission is still denied. Search or tap the map to choose a location.');
                  return;
                }

                const loc = await Location.getCurrentPositionAsync({
                  accuracy: Location.Accuracy.Balanced,
                });

                const coords = {
                  latitude: loc.coords.latitude,
                  longitude: loc.coords.longitude,
                };

                setSelected(coords);
                const reverse = await Location.reverseGeocodeAsync(coords);
                const place = reverse[0];
                if (place) {
                  const name = place.name || place.street || 'Current Location';
                  const formattedAddress = [place.street, place.city, place.country].filter(Boolean).join(', ');
                  setLocationName(name);
                  setAddress(formattedAddress || name);
                  setQuery(name);
                }
                setLocationPermissionMessage('');
              })();
            }}
            style={styles.permissionAction}
          >
            <Text style={styles.permissionActionText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.searchBar}>
        <TextInput
          value={query}
          onChangeText={handleQueryChange}
          placeholder="Search for a place..."
          placeholderTextColor="#9ca3af"
          style={styles.input}
          autoFocus
        />
        {searching && <ActivityIndicator size="small" style={styles.loader} />}
      </View>

      {results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.place_id}
          style={styles.results}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.resultItem} onPress={() => void selectPlace(item)}>
              <Text style={styles.resultMain}>{item.main_text}</Text>
              <Text style={styles.resultSub}>{item.secondary_text}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {selected ? (
        <View style={styles.mapContainer}>
          <ReminderMap center={selected} radius={300} onLocationSelect={handleMapTap} height={380} />
        </View>
      ) : (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.placeholderText}>Getting current location...</Text>
        </View>
      )}

      {address ? (
        <Text style={styles.addressLabel} numberOfLines={2}>
          {address}
        </Text>
      ) : null}

      {!GOOGLE_PLACES_KEY ? (
        <Text style={styles.warningText}>Google Places key is missing. Map tap still works.</Text>
      ) : null}

      <TouchableOpacity
        style={[styles.confirm, !selected && styles.confirmDisabled]}
        onPress={confirmSelection}
        disabled={!selected}
      >
        <Text style={styles.confirmText}>Confirm Location</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#111',
  },
  permissionBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: -4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fdba74',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  permissionText: {
    flex: 1,
    color: '#9a3412',
    fontSize: 13,
    lineHeight: 18,
  },
  permissionAction: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#ea580c',
  },
  permissionActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  loader: {
    marginRight: 12,
  },
  results: {
    maxHeight: 220,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 20,
  },
  resultItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  resultMain: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  resultSub: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  mapContainer: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  mapPlaceholder: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    height: 380,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#6b7280',
    fontSize: 14,
  },
  addressLabel: {
    marginHorizontal: 16,
    marginTop: 10,
    fontSize: 13,
    color: '#6b7280',
  },
  warningText: {
    marginHorizontal: 16,
    marginTop: 6,
    fontSize: 12,
    color: '#b45309',
  },
  confirm: {
    margin: 16,
    backgroundColor: '#6366f1',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDisabled: {
    opacity: 0.4,
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
