import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { debounce } from 'lodash';
import { X, Search, MapPin } from 'lucide-react-native';
import ReminderMap from '@/components/maps/ReminderMap';
import { Coordinates } from '@/lib/location/distance';
import { geocoder, PlaceResult } from '@/lib/location/geocoding';
import { haptics } from '@/lib/haptics';
import { useLocationDraft } from '@/context/locationDraftContext';
import { ACCENT } from '@/lib/theme';

// Lucide takes a colour prop, not a class, so the muted tone is named here.
const MUTED = '#6B7280';

export default function LocationPickerScreen() {
  const { setDraft } = useLocationDraft();
  // Guards every setState that follows an await, so a screen closed mid-request
  // does not write into a component that is gone.
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);
  const [query,        setQuery]        = useState('');
  const [results,      setResults]      = useState<PlaceResult[]>([]);
  const [searching,    setSearching]    = useState(false);
  const [selected,     setSelected]     = useState<Coordinates | null>(null);
  const [address,      setAddress]      = useState('');
  const [locationName, setLocationName] = useState('');
  const [locating,     setLocating]     = useState(true);

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

  // Built once in an effect and cancelled on unmount. Previously this was
  // useCallback(debounce(...), []), which built a fresh debounced function on
  // every render only to discard it, and left a pending search able to resolve
  // into state after the screen had closed.
  const searchRef = useRef<ReturnType<typeof debounce> | null>(null);

  useEffect(() => {
    let live = true;

    const run = debounce(async (text: string) => {
      if (text.length < 2) { setResults([]); return; }
      setSearching(true);
      try {
        const found = await geocoder.search(text);
        if (live) setResults(found);
      } catch {
        if (live) setResults([]);
      } finally {
        if (live) setSearching(false);
      }
    }, 400);

    searchRef.current = run;

    return () => {
      live = false;
      run.cancel();
      searchRef.current = null;
    };
  }, []);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    searchRef.current?.(text);
  };

  const selectPlace = async (place: PlaceResult) => {
    setSelected(place.coordinates);
    setLocationName(place.name);
    setAddress(place.address);
    setQuery(place.name);
    setResults([]);

    // Only results beyond the first arrive unlabelled, so this is where they get
    // a real address — one geocoder call on a deliberate choice, rather than one
    // per result on every keystroke.
    try {
      const exact = await geocoder.reverse(place.coordinates);
      if (!exact || !mountedRef.current) return;
      setLocationName(exact.name);
      setAddress(exact.address);
      setQuery(exact.name);
    } catch {
      // Keep what the search gave us.
    }
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
    haptics.select();
    setDraft({
      name:        locationName,
      address:     address,
      coordinates: selected,
    });
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4">
        <TouchableOpacity
          className="w-10 h-10 rounded-full items-center justify-center bg-card dark:bg-card-dark"
          onPress={() => router.back()}
        >
          <X size={20} color={ACCENT} />
        </TouchableOpacity>
        <Text className="text-foreground dark:text-foreground-dark text-[13px] font-bold tracking-[3px]">
          CHOOSE LOCATION
        </Text>
        <View className="w-10" />
      </View>

      {/* Search bar */}
      <View className="flex-row items-center mx-5 mb-3 rounded-2xl px-4 h-[52px] bg-card dark:bg-card-dark">
        <Search size={18} color={MUTED} style={{ marginRight: 10 }} />
        <TextInput
          value={query}
          onChangeText={handleQueryChange}
          placeholder="Search for a place..."
          placeholderTextColor={MUTED}
          className="flex-1 text-[15px] text-foreground dark:text-foreground-dark"
        />
        {searching
          ? <ActivityIndicator size="small" color={ACCENT} />
          : query.length > 0
            ? <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
                <X size={16} color={MUTED} />
              </TouchableOpacity>
            : null
        }
      </View>

      {/* Autocomplete results */}
      {results.length > 0 && (
        <View className="mx-5 mb-2.5 rounded-2xl max-h-[200px] overflow-hidden border bg-card dark:bg-card-dark border-border dark:border-border-dark">
          <FlatList
            data={results}
            keyExtractor={item => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                className="flex-row items-center p-3.5 border-b border-border dark:border-border-dark"
                onPress={() => { void selectPlace(item); }}
              >
                <View className="w-8 h-8 rounded-full items-center justify-center mr-3 bg-accent/20 dark:bg-accent-dark/20">
                  <MapPin size={14} color={ACCENT} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold mb-0.5 text-foreground dark:text-foreground-dark">
                    {item.name}
                  </Text>
                  <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark" numberOfLines={1}>
                    {item.address}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Map */}
      <View className="mx-5 rounded-[20px] overflow-hidden border border-border dark:border-border-dark">
        {locating ? (
          <View className="h-[320px] items-center justify-center gap-3 bg-card dark:bg-card-dark">
            <ActivityIndicator size="large" color={ACCENT} />
            <Text className="text-[13px] text-muted-foreground dark:text-muted-foreground-dark">
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
        <View className="flex-row items-center mx-5 mt-3 p-3.5 rounded-2xl border bg-card dark:bg-card-dark border-border dark:border-border-dark">
          <View className="w-8 h-8 rounded-full items-center justify-center mr-3 bg-accent/20 dark:bg-accent-dark/20">
            <MapPin size={12} color={ACCENT} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
              {locationName}
            </Text>
            <Text className="text-xs mt-0.5 text-muted-foreground dark:text-muted-foreground-dark" numberOfLines={1}>
              {address}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Confirm button */}
      <TouchableOpacity
        className={`mx-5 mt-4 mb-2 rounded-full h-14 items-center justify-center ${
          selected && !locating
            ? 'bg-accent dark:bg-accent-dark'
            : 'bg-card dark:bg-card-dark'
        }`}
        onPress={confirmSelection}
        disabled={!selected || locating}
        activeOpacity={0.8}
      >
        <Text
          className={`text-base font-bold ${
            selected && !locating
              ? 'text-accent-foreground dark:text-accent-foreground-dark'
              : 'text-muted-foreground dark:text-muted-foreground-dark'
          }`}
        >
          Confirm Location
        </Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}
