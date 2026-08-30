import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Circle, MapPressEvent, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Coordinates } from '@/lib/location/distance';
import { ACCENT, accentAlpha } from '@/lib/theme';

interface Props {
  center:            Coordinates;
  radius:            number;
  onLocationSelect?: (coords: Coordinates) => void;
  height?:           number;
}

export default function ReminderMap({
  center,
  radius,
  onLocationSelect,
  height = 300,
}: Props) {
  const handleMapPress = (e: MapPressEvent) => {
    if (!onLocationSelect) return;
    onLocationSelect(e.nativeEvent.coordinate);
  };

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        style={styles.map}
        // iOS falls through to Apple Maps, which needs no API key.
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        region={regionForRadius(center, radius)}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        <Marker coordinate={center} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.pin} />
        </Marker>

        {/* Radius is in metres, so the overlay is geographically exact */}
        <Circle
          center={center}
          radius={radius}
          fillColor={accentAlpha(0.15)}
          strokeColor={accentAlpha(0.7)}
          strokeWidth={2}
        />
      </MapView>
    </View>
  );
}

// Frame the circle with a margin so the whole radius stays on screen.
function regionForRadius(center: Coordinates, radius: number) {
  const METRES_PER_DEGREE_LAT = 111_320;
  const span = (radius * 2.5) / METRES_PER_DEGREE_LAT;
  const latitudeDelta = Math.max(span, 0.002);

  // Longitude degrees shrink towards the poles.
  const cosLat = Math.max(Math.cos((center.latitude * Math.PI) / 180), 0.01);

  return {
    latitude:      center.latitude,
    longitude:     center.longitude,
    latitudeDelta,
    longitudeDelta: latitudeDelta / cosLat,
  };
}

const styles = StyleSheet.create({
  container: { borderRadius: 16, overflow: 'hidden' },
  map:       { flex: 1 },
  pin: {
    width:           16,
    height:          16,
    borderRadius:    8,
    backgroundColor: ACCENT,
    borderWidth:     3,
    borderColor:     '#fff',
  },
});
