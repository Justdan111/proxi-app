import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, SafeAreaView, StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { debounce } from 'lodash';
import { X, Search, MapPin } from 'lucide-react-native';
import { useTheme } from '@/context/themeContext';
import ReminderMap from '@/components/maps/ReminderMap';
import { Coordinates } from '@/lib/location/distance';
import { geocoder, PlaceResult } from '@/lib/location/geocoding';

export default function LocationPickerScreen() {
  const { isDark } = useTheme();
  const [query,        setQuery]        = useState('');
  const [results,      setResults]      = useState<PlaceResult[]>([]);
  const [searching,    setSearching]    = useState(false);
  const [selected,     setSelected]     = useState<Coordinates | null>(null);
  const [address,      setAddress]      = useState('');
  const [locationName, setLocationName] = useState('');
  const [locating,     setLocating]     = useState(true);

  const c = isDark ? dark : light;

  // Get accurate GPS on mount
  useEffect(() => {
    (async () => {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocating(false); return; }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 0,
      });

      const coords = {
        latitude:  loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setSelected(coords);

      try {
        const place = await geocoder.reverse(coords);
        if (place) {
          setLocationName(place.name);
          setAddress(place.address);
        }
      } catch {}

      setLocating(false);
    })();
  }, []);

  const searchPlaces = useCallback(
    debounce(async (text: string) => {
      if (text.length < 2) { setResults([]); return; }
      setSearching(true);
      try {
        setResults(await geocoder.search(text));
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

  const selectPlace = (place: PlaceResult) => {
    setSelected(place.coordinates);
    setLocationName(place.name);
    setAddress(place.address);
    setQuery(place.name);
    setResults([]);
  };

  const handleMapTap = async (coords: Coordinates) => {
    setSelected(coords);
    setResults([]);
    try {
      const place = await geocoder.reverse(coords);
      if (place) {
        setLocationName(place.name);
        setAddress(place.address);
        setQuery(place.name);
      }
    } catch {
      setLocationName('Selected Location');
      setAddress(`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);
    }
  };

  const confirmSelection = () => {
    if (!selected) return;
    router.back();
    // ✅ Matches exactly what add-reminder.tsx reads
    router.setParams({
      selectedLocation: locationName,
      selectedAddress:  address,
      selectedLat:      String(selected.latitude),
      selectedLon:      String(selected.longitude),
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: c.card }]}
          onPress={() => router.back()}
        >
          <X size={20} color={c.accent} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text, fontFamily: 'Courier' }]}>
          CHOOSE LOCATION
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: c.card }]}>
        <Search size={18} color={c.muted} style={{ marginRight: 10 }} />
        <TextInput
          value={query}
          onChangeText={handleQueryChange}
          placeholder="Search for a place..."
          placeholderTextColor={c.muted}
          style={[styles.input, { color: c.text }]}
        />
        {searching
          ? <ActivityIndicator size="small" color={c.accent} />
          : query.length > 0
            ? <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
                <X size={16} color={c.muted} />
              </TouchableOpacity>
            : null
        }
      </View>

      {/* Autocomplete results */}
      {results.length > 0 && (
        <View style={[styles.resultsContainer, { backgroundColor: c.card, borderColor: c.border }]}>
          <FlatList
            data={results}
            keyExtractor={item => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.resultItem, { borderBottomColor: c.border }]}
                onPress={() => selectPlace(item)}
              >
                <View style={[styles.resultIconWrap, { backgroundColor: c.accentFaint }]}>
                  <MapPin size={14} color={c.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.resultMain, { color: c.text }]}>{item.name}</Text>
                  <Text style={[styles.resultSub,  { color: c.muted }]} numberOfLines={1}>
                    {item.address}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Map */}
      <View style={[styles.mapContainer, { borderColor: c.border }]}>
        {locating ? (
          <View style={[styles.mapPlaceholder, { backgroundColor: c.card }]}>
            <ActivityIndicator size="large" color={c.accent} />
            <Text style={[styles.locatingText, { color: c.muted }]}>
              Getting your location...
            </Text>
          </View>
        ) : selected ? (
          <ReminderMap
            center={selected}
            radius={300}
            onLocationSelect={handleMapTap}
            height={320}
          />
        ) : null}
      </View>

      {/* Selected place pill */}
      {locationName ? (
        <View style={[styles.selectedPill, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[styles.pillDot, { backgroundColor: c.accentFaint }]}>
            <MapPin size={12} color={c.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pillName, { color: c.text }]}>{locationName}</Text>
            <Text style={[styles.pillAddress, { color: c.muted }]} numberOfLines={1}>
              {address}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Confirm button — matches your rounded-full accent button */}
      <TouchableOpacity
        style={[
          styles.confirm,
          { backgroundColor: selected && !locating ? c.accent : c.card },
        ]}
        onPress={confirmSelection}
        disabled={!selected || locating}
        activeOpacity={0.8}
      >
        <Text style={[
          styles.confirmText,
          { color: selected && !locating ? c.accentForeground : c.muted },
        ]}>
          Confirm Location
        </Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

// ── Theme tokens 
const dark = {
  bg:              '#0f0f0f',
  card:            '#1a1a1a',
  text:            '#ffffff',
  muted:           '#6B7280',
  border:          '#2a2a2a',
  accent:          '#00D4AA',
  accentFaint:     'rgba(0,212,170,0.15)',
  accentForeground: '#0f0f0f',
};

const light = {
  bg:              '#f9f9f9',
  card:            '#ffffff',
  text:            '#1a1a1a',
  muted:           '#6B7280',
  border:          '#e5e7eb',
  accent:          '#00D4AA',
  accentFaint:     'rgba(0,212,170,0.15)',
  accentForeground: '#ffffff',
};

const styles = StyleSheet.create({
  container:      { flex: 1 },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  iconBtn:        { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle:    { fontSize: 13, fontWeight: '700', letterSpacing: 3 },
  searchBar:      { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 12, borderRadius: 16, paddingHorizontal: 16, height: 52 },
  input:          { flex: 1, fontSize: 15 },
  resultsContainer: { marginHorizontal: 20, borderRadius: 16, marginBottom: 10, maxHeight: 200, overflow: 'hidden', borderWidth: 1 },
  resultItem:     { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1 },
  resultIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  resultMain:     { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  resultSub:      { fontSize: 12 },
  mapContainer:   { marginHorizontal: 20, borderRadius: 20, overflow: 'hidden', borderWidth: 1 },
  mapPlaceholder: { height: 320, alignItems: 'center', justifyContent: 'center', gap: 12 },
  locatingText:   { fontSize: 13 },
  selectedPill:   { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  pillDot:        { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  pillName:       { fontSize: 14, fontWeight: '600' },
  pillAddress:    { fontSize: 12, marginTop: 2 },
  confirm:        { marginHorizontal: 20, marginTop: 16, marginBottom: 8, borderRadius: 100, height: 56, alignItems: 'center', justifyContent: 'center' },
  confirmText:    { fontSize: 16, fontWeight: '700' },
});