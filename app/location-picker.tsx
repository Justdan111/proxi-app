import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import debounce from 'lodash/debounce';
import ReminderMap from '@/components/maps/ReminderMap';
import { Coordinates } from '@/lib/location/distance';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN!;

interface MapboxFeature {
  id:         string;
  place_name: string;
  text:       string;
  center:     [number, number]; // [longitude, latitude]
  context?:   { id: string; text: string }[];
}

export default function LocationPickerScreen() {
  const [query,        setQuery]        = useState('');
  const [results,      setResults]      = useState<MapboxFeature[]>([]);
  const [searching,    setSearching]    = useState(false);
  const [selected,     setSelected]     = useState<Coordinates | null>(null);
  const [address,      setAddress]      = useState('');
  const [locationName, setLocationName] = useState('');

  // Start at user's current location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setSelected({
        latitude:  loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    })();
  }, []);

  // Mapbox Geocoding API — free, no credit card
  const searchPlaces = useCallback(
    debounce(async (text: string) => {
      if (text.length < 2) { setResults([]); return; }
      setSearching(true);
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5&language=en`;
        const res  = await fetch(url);
        const json = await res.json();
        setResults(json.features ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400),
    []
  );

  const handleQueryChange = (text: string) => {
    setQuery(text);
    searchPlaces(text);
  };

  const selectPlace = (feature: MapboxFeature) => {
    const [lng, lat] = feature.center;
    setSelected({ latitude: lat, longitude: lng });
    setLocationName(feature.text);
    setAddress(feature.place_name);
    setQuery(feature.text);
    setResults([]);
  };

  // User tapped directly on map
  const handleMapTap = async (coords: Coordinates) => {
    setSelected(coords);
    setResults([]);

    // Mapbox reverse geocoding
    try {
      const url  = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.longitude},${coords.latitude}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
      const res  = await fetch(url);
      const json = await res.json();
      const feature: MapboxFeature = json.features?.[0];

      if (feature) {
        setLocationName(feature.text);
        setAddress(feature.place_name);
        setQuery(feature.text);
      }
    } catch {
      setLocationName('Selected Location');
      setAddress(`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);
    }
  };

  const confirmSelection = () => {
    if (!selected) return;
    router.back();
    router.setParams({
      selectedLat:      String(selected.latitude),
      selectedLng:      String(selected.longitude),
      selectedAddress:  address,
      selectedLocation: locationName,
    });
  };

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <TextInput
          value={query}
          onChangeText={handleQueryChange}
          placeholder="Search for a place..."
          placeholderTextColor="#9ca3af"
          style={styles.input}
          autoFocus
        />
        {searching && <ActivityIndicator size="small" style={{ marginRight: 12 }} />}
      </View>

      {/* Autocomplete results */}
      {results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          style={styles.results}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => selectPlace(item)}
            >
              <Text style={styles.resultMain}>{item.text}</Text>
              <Text style={styles.resultSub} numberOfLines={1}>
                {item.place_name}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Map */}
      {selected && (
        <View style={styles.mapContainer}>
          <ReminderMap
            center={selected}
            radius={300}
            onLocationSelect={handleMapTap}
            height={380}
          />
        </View>
      )}

      {/* Address label */}
      {address ? (
        <Text style={styles.addressLabel} numberOfLines={2}>{address}</Text>
      ) : null}

      {/* Confirm button */}
      <TouchableOpacity
        style={[styles.confirm, !selected && styles.confirmDisabled]}
        onPress={confirmSelection}
        disabled={!selected}
      >
        <Text style={styles.confirmText}>Confirm Location</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#fff' },
  searchBar:       { flexDirection: 'row', alignItems: 'center', margin: 16, backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 12 },
  input:           { flex: 1, height: 48, fontSize: 16, color: '#111' },
  results:         { maxHeight: 220, marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  resultItem:      { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  resultMain:      { fontSize: 15, fontWeight: '600', color: '#111' },
  resultSub:       { fontSize: 13, color: '#6b7280', marginTop: 2 },
  mapContainer:    { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  addressLabel:    { marginHorizontal: 16, marginTop: 10, fontSize: 13, color: '#6b7280' },
  confirm:         { margin: 16, backgroundColor: '#6366f1', borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' },
  confirmDisabled: { opacity: 0.4 },
  confirmText:     { color: '#fff', fontSize: 16, fontWeight: '700' },
});