import React, {  } from 'react';
import { StyleSheet, View } from 'react-native';
import Mapbox, {
  MapView,
  Camera,
  PointAnnotation,
  CircleLayer,
  ShapeSource,
  UserLocation,
} from '@rnmapbox/maps';
import { Coordinates } from '@/lib/location/distance';

// Set token once — do this at app root ideally
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN!);

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
  // GeoJSON circle for the radius overlay
  const circleGeoJSON: GeoJSON.Feature = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [center.longitude, center.latitude],
    },
    properties: {},
  };

  const handleMapPress = (e: any) => {
    if (!onLocationSelect) return;
    const [longitude, latitude] = e.geometry.coordinates;
    onLocationSelect({ latitude, longitude });
  };

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        style={styles.map}
        styleURL={Mapbox.StyleURL.Street}
        onPress={handleMapPress}
        attributionEnabled={false}
        logoEnabled={false}
      >
        {/* Camera — moves map to center */}
        <Camera
          centerCoordinate={[center.longitude, center.latitude]}
          zoomLevel={radiusToZoom(radius)}
          animationMode="flyTo"
          animationDuration={600}
        />

        {/* Show user's current GPS dot */}
        <UserLocation visible animated />

        {/* Selected location pin */}
        <PointAnnotation
          id="selected"
          coordinate={[center.longitude, center.latitude]}
        >
          <View style={styles.pin} />
        </PointAnnotation>

        {/* Radius circle */}
        <ShapeSource id="radius-source" shape={circleGeoJSON}>
          <CircleLayer
            id="radius-fill"
            style={{
              circleRadius:       metresToPixels(radius),
              circleColor:        'rgba(99, 102, 241, 0.15)',
              circleStrokeColor:  'rgba(99, 102, 241, 0.7)',
              circleStrokeWidth:  2,
              circlePitchAlignment: 'map',
            }}
          />
        </ShapeSource>
      </MapView>
    </View>
  );
}

// Convert radius in metres to a Mapbox zoom level
function radiusToZoom(radius: number): number {
  if (radius <= 100)  return 17;
  if (radius <= 300)  return 16;
  if (radius <= 500)  return 15;
  if (radius <= 1000) return 14;
  return 13;
}

// Rough pixel conversion for circle radius at zoom 15
// Mapbox CircleLayer radius is in pixels — this is an approximation
function metresToPixels(metres: number): number {
  return metres / 10;
}

const styles = StyleSheet.create({
  container: { borderRadius: 16, overflow: 'hidden' },
  map:       { flex: 1 },
  pin: {
    width:           16,
    height:          16,
    borderRadius:    8,
    backgroundColor: '#6366f1',
    borderWidth:     3,
    borderColor:     '#fff',
  },
});