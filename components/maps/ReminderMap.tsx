import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Coordinates } from '@/lib/location/distance';

interface Props {
  center:          Coordinates;
  radius:          number;         // metres
  onLocationSelect?: (coords: Coordinates) => void; // undefined = read-only
  markers?:        { id: string; coords: Coordinates; icon: string; title: string }[];
  height?:         number;
}

export default function ReminderMap({
  center,
  radius,
  onLocationSelect,
  markers = [],
  height = 300,
}: Props) {
  const mapRef = useRef<MapView>(null);

  // Animate map to center when it changes
  useEffect(() => {
    mapRef.current?.animateToRegion(toRegion(center, radius), 600);
  }, [center, radius]);

  const handleMapPress = (e: any) => {
    if (!onLocationSelect) return;
    const { latitude, longitude } = e.nativeEvent.coordinate;
    onLocationSelect({ latitude, longitude });
  };

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={toRegion(center, radius)}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton
        toolbarEnabled={false}
      >
        {/* Selected location marker */}
        <Marker
          coordinate={center}
          pinColor="#6366f1"
        />

        {/* Radius circle */}
        <Circle
          center={center}
          radius={radius}
          fillColor="rgba(99, 102, 241, 0.15)"
          strokeColor="rgba(99, 102, 241, 0.6)"
          strokeWidth={2}
        />

        {/* Additional markers (e.g. all reminders on home map) */}
        {markers.map(m => (
          <Marker
            key={m.id}
            coordinate={m.coords}
            title={m.title}
          >
            {/* Custom emoji marker */}
            <View style={styles.emojiMarker}>
              {/* render icon text if needed */}
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

// Calculate map region that fits the radius circle
function toRegion(center: Coordinates, radius: number): Region {
  const delta = (radius / 111000) * 2.5; // degrees per metre × padding
  return {
    latitude:        center.latitude,
    longitude:       center.longitude,
    latitudeDelta:   delta,
    longitudeDelta:  delta,
  };
}

const styles = StyleSheet.create({
  container: { borderRadius: 16, overflow: 'hidden' },
  map:       { flex: 1 },
  emojiMarker: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
});