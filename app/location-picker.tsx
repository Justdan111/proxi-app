import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { 
  Search,
  Navigation, 
  ShoppingBasket, 
  Dumbbell, 
  Briefcase,
  ArrowLeft,
  MapPin,
  Home,
  Coffee,
  Building2,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useTheme } from '@/context/themeContext';

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

const savedPlaces = [
  {
    id: '1',
    name: 'Home',
    address: 'Add your home address',
    icon: Home,
  },
  {
    id: '2',
    name: 'Work',
    address: 'Add your work address',
    icon: Building2,
  },
  {
    id: '3',
    name: 'Favorite Cafe',
    address: 'Add a cafe location',
    icon: Coffee,
  },
];

export default function LocationPickerScreen({ onLocationSelect, onBack }: LocationPickerScreenProps) {
  const [search, setSearch] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    name: string;
    address: string;
  } | null>(null);
  const router = useRouter();
  const { isDark } = useTheme();

  // Animation values
  const headerOpacity = useSharedValue(0);
  const searchOpacity = useSharedValue(0);
  const searchScale = useSharedValue(0.95);

  useEffect(() => {
    // Animations
    headerOpacity.value = withTiming(1, { duration: 400 });
    searchOpacity.value = withTiming(1, { duration: 600 });
    searchScale.value = withSpring(1, { damping: 12, stiffness: 100 });
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const searchAnimatedStyle = useAnimatedStyle(() => ({
    opacity: searchOpacity.value,
    transform: [{ scale: searchScale.value }],
  }));

  const getCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setCurrentLocation({
          name: 'Location access denied',
          address: 'Please enable location permissions',
        });
        setIsLoadingLocation(false);
        return;
      }

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
        
        setCurrentLocation({ name, address: addressStr });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setCurrentLocation({
        name: 'Unable to get location',
        address: 'Please try again',
      });
    } finally {
      setIsLoadingLocation(false);
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

  const handleUseCurrentLocation = async () => {
    if (currentLocation) {
      handleSelectLocation(currentLocation.name, currentLocation.address);
    } else {
      await getCurrentLocation();
      // After getting location, use the updated state
      setTimeout(() => {
        if (currentLocation) {
          handleSelectLocation(currentLocation.name, currentLocation.address);
        }
      }, 100); // Small delay to allow state to update
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      {/* Header */}
      <Animated.View style={headerAnimatedStyle} className="flex-row items-center px-6 py-4">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <ArrowLeft size={24} color={isDark ? '#ffffff' : '#1a1a1a'} />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-foreground dark:text-foreground-dark text-lg font-bold tracking-[2px] uppercase">
          Select Location
        </Text>
        <View className="w-10" />
      </Animated.View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <Animated.View style={searchAnimatedStyle} className="mb-6">
          <View className="flex-row items-center bg-card dark:bg-card-dark rounded-2xl px-5 py-4 border border-border dark:border-border-dark">
            <Search size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            <TextInput
              placeholder="Search for a place..."
              placeholderTextColor="#6B7280"
              value={search}
              onChangeText={setSearch}
              className="flex-1 ml-3 text-foreground dark:text-foreground-dark text-base"
            />
          </View>
        </Animated.View>

        {/* Current Location */}
        <Animated.View entering={FadeInDown.delay(200).springify()} className="mb-8">
          <TouchableOpacity 
            onPress={handleUseCurrentLocation}
            className="flex-row items-center bg-card dark:bg-card-dark rounded-2xl px-5 py-4 border border-accent dark:border-accent-dark"
          >
            <View className="bg-accent/20 dark:bg-accent-dark/20 rounded-full p-3 mr-4">
              {isLoadingLocation ? (
                <ActivityIndicator size="small" color="#00D4AA" />
              ) : (
                <Navigation size={20} color="#00D4AA" />
              )}
            </View>
            <View className="flex-1">
              <Text className="font-bold text-foreground dark:text-foreground-dark text-base">
                Use Current Location
              </Text>
              <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                {currentLocation?.address || 'Tap to detect your location'}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Suggested Categories */}
        <Animated.View entering={FadeInDown.delay(300).springify()} className="mb-8">
          <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase tracking-[2px] mb-4">
            Quick Categories
          </Text>
          <View className="flex-row gap-3">
            {suggestedLocations.map((location, index) => (
              <Animated.View
                key={location.id}
                entering={FadeInDown.delay(400 + index * 100).springify()}
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

        {/* Saved Places */}
        <Animated.View entering={FadeInDown.delay(500).springify()} className="mb-8">
          <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase tracking-[2px] mb-4">
            Saved Places
          </Text>
          <View className="gap-3">
            {savedPlaces.map((place, index) => (
              <Animated.View
                key={place.id}
                entering={FadeInDown.delay(600 + index * 100).springify()}
              >
                <TouchableOpacity 
                  onPress={() => handleSelectLocation(place.name, place.address)}
                  className="flex-row items-center bg-card dark:bg-card-dark rounded-2xl px-5 py-4 border border-border dark:border-border-dark"
                >
                  <View className="bg-muted dark:bg-muted-dark rounded-full p-3 mr-4">
                    <place.icon size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-foreground dark:text-foreground-dark text-base">
                      {place.name}
                    </Text>
                    <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                      {place.address}
                    </Text>
                  </View>
                  <MapPin size={20} color={isDark ? '#4B5563' : '#9CA3AF'} />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Recent Searches placeholder */}
        <Animated.View entering={FadeInDown.delay(700).springify()} className="mb-8 pb-8">
          <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase tracking-[2px] mb-4">
            Recent Searches
          </Text>
          <View className="bg-card dark:bg-card-dark rounded-2xl p-6 items-center border border-border dark:border-border-dark">
            <MapPin size={32} color={isDark ? '#4B5563' : '#9CA3AF'} />
            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-sm mt-3 text-center">
              No recent searches yet
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
