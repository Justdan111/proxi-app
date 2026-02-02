import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { 
  Mic, 
  Navigation, 
  Plus, 
  ShoppingBasket, 
  Dumbbell, 
  Briefcase,
  ArrowLeft,
  Check,
} from 'lucide-react-native';
import Svg, { Defs, RadialGradient, Stop, Circle as SvgCircle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useTheme } from '@/context/themeContext';

const { width, height } = Dimensions.get('window');

type LocationPickerScreenProps = {
  onLocationSelect?: (location: any) => void;
  onBack?: () => void;
};

const suggestedLocations = [
  {
    id: '1',
    name: 'Grocery Stores',
    icon: ShoppingBasket,
    category: 'shopping',
  },
  {
    id: '2',
    name: 'Gyms',
    icon: Dumbbell,
    category: 'fitness',
  },
  {
    id: '3',
    name: 'Work',
    icon: Briefcase,
    category: 'work',
  },
];

const mapDarkStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0a0a0a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a0a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6B7280' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9CA3AF' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6B7280' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#1a1a1a' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6B7280' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1a1a1a' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#0f0f0f' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#1f1f1f' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#0f0f0f' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0f0f0f' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4B5563' }],
  },
];

export default function LocationPickerScreen({ onLocationSelect, onBack }: LocationPickerScreenProps) {
  const [search, setSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const mapRef = useRef<MapView>(null);
  const router = useRouter();
  const { isDark } = useTheme();

  // Sample markers with proximity circles
  const [markers] = useState([
    {
      id: '1',
      latitude: 9.0765,
      longitude: 7.3986,
      radius: 200,
    },
    {
      id: '2',
      latitude: 9.0820,
      longitude: 7.4050,
      radius: 300,
    },
    {
      id: '3',
      latitude: 9.0700,
      longitude: 7.4100,
      radius: 250,
    },
  ]);

  // Animation values
  const searchOpacity = useSharedValue(0);
  const searchScale = useSharedValue(0.95);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    // Search bar animation
    searchOpacity.value = withTiming(1, { duration: 600 });
    searchScale.value = withSpring(1, { damping: 12, stiffness: 100 });

    // Pulsing animation for markers
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Glowing effect
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const searchAnimatedStyle = useAnimatedStyle(() => ({
    opacity: searchOpacity.value,
    transform: [{ scale: searchScale.value }],
  }));

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address) {
        const name = address.name || address.street || 'Current Location';
        const addressStr = [address.city, address.region, address.country]
          .filter(Boolean)
          .join(', ');
        
        setSelectedLocation({
          name,
          address: addressStr,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        mapRef.current?.animateToRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleSelectLocation = (name: string, address: string) => {
    router.push({
      pathname: '/add-reminder',
      params: {
        selectedLocation: name,
        selectedAddress: address,
      },
    });
  };

  const handleConfirmSelection = () => {
    if (selectedLocation) {
      handleSelectLocation(selectedLocation.name, selectedLocation.address);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-1">
        {/* Header with back button */}
        <Animated.View 
          entering={FadeIn.delay(100)} 
          className="absolute top-4 left-6 z-20"
        >
          <TouchableOpacity 
            onPress={() => router.back()}
            className="bg-card dark:bg-card-dark rounded-full p-3 border border-border dark:border-border-dark"
          >
            <ArrowLeft size={24} color={isDark ? '#ffffff' : '#1a1a1a'} />
          </TouchableOpacity>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View style={searchAnimatedStyle} className="absolute top-4 left-20 right-6 z-10">
          <View className="flex-row items-center bg-card dark:bg-card-dark rounded-full px-5 py-4 border-2 border-accent dark:border-accent-dark">
            <TextInput
              placeholder="Find a place..."
              placeholderTextColor="#6B7280"
              value={search}
              onChangeText={setSearch}
              className="flex-1 text-foreground dark:text-foreground-dark text-base"
            />
            <TouchableOpacity className="ml-2">
              <Mic size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Map */}
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          customMapStyle={mapDarkStyle}
          initialRegion={{
            latitude: 9.0765,
            longitude: 7.3986,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {/* Render proximity circles and markers */}
          {markers.map((marker) => (
            <React.Fragment key={marker.id}>
              {/* Outer glow circle */}
              <Circle
                center={{
                  latitude: marker.latitude,
                  longitude: marker.longitude,
                }}
                radius={marker.radius * 1.5}
                fillColor="rgba(0, 212, 170, 0.08)"
                strokeColor="transparent"
              />
              
              {/* Main proximity circle */}
              <Circle
                center={{
                  latitude: marker.latitude,
                  longitude: marker.longitude,
                }}
                radius={marker.radius}
                fillColor="rgba(0, 212, 170, 0.15)"
                strokeColor="#00D4AA"
                strokeWidth={2}
              />

              {/* Center marker */}
              <Marker
                coordinate={{
                  latitude: marker.latitude,
                  longitude: marker.longitude,
                }}
              >
                <View className="items-center justify-center">
                  <View className="bg-accent dark:bg-accent-dark rounded-full w-4 h-4" />
                </View>
              </Marker>
            </React.Fragment>
          ))}

          {/* User location marker */}
          <Marker
            coordinate={{
              latitude: 9.0790,
              longitude: 7.4020,
            }}
          >
            <View className="items-center justify-center">
              <View className="bg-white rounded-full w-6 h-6 border-4 border-blue-500" />
            </View>
          </Marker>
        </MapView>

        {/* Current Location Button */}
        <Animated.View entering={FadeIn.delay(400)} className="absolute bottom-60 right-6">
          <TouchableOpacity
            onPress={getCurrentLocation}
            className="bg-card dark:bg-card-dark rounded-full p-4 border border-border dark:border-border-dark shadow-lg"
          >
            <Navigation size={24} color="#00D4AA" />
          </TouchableOpacity>
        </Animated.View>

        {/* Confirm Selection Button - only show when location is selected */}
        {selectedLocation && (
          <Animated.View entering={FadeIn.delay(200)} className="absolute bottom-60 right-24">
            <TouchableOpacity 
              onPress={handleConfirmSelection}
              className="bg-accent dark:bg-accent-dark rounded-full p-5 shadow-lg"
            >
              <Check size={28} color={isDark ? '#1a1a1a' : '#ffffff'} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Selected Location Card */}
        {selectedLocation && (
          <Animated.View 
            entering={FadeInDown.delay(100).springify()} 
            className="absolute bottom-48 left-6 right-6 bg-card dark:bg-card-dark rounded-2xl p-4 border border-accent dark:border-accent-dark"
          >
            <Text className="text-foreground dark:text-foreground-dark font-bold text-base">
              {selectedLocation.name}
            </Text>
            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-sm mt-1">
              {selectedLocation.address}
            </Text>
          </Animated.View>
        )}

        {/* Suggested Locations */}
        <Animated.View entering={FadeInDown.delay(600).springify()} className="absolute bottom-0 left-0 right-0 bg-background dark:bg-background-dark pt-4 px-6 pb-8 rounded-t-3xl border-t border-border dark:border-border-dark">
          <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase tracking-[3px] mb-4">
            Suggested Locations
          </Text>

          <View className="flex-row gap-3">
            {suggestedLocations.map((location, index) => (
              <Animated.View
                key={location.id}
                entering={FadeInDown.delay(700 + index * 100).springify()}
                className="flex-1"
              >
                <TouchableOpacity 
                  onPress={() => handleSelectLocation(location.name, 'Nearby')}
                  className="bg-card dark:bg-card-dark rounded-2xl p-4 items-center border border-border dark:border-border-dark"
                >
                  <View className="bg-accent/20 dark:bg-accent-dark/20 rounded-2xl p-3 mb-3">
                    <location.icon size={24} color="#00D4AA" />
                  </View>
                  <Text className="text-foreground dark:text-foreground-dark text-xs font-semibold text-center">
                    {location.name}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}