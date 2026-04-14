import React, { useRef, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { Search, Bell, MapPin, Plus, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useTheme } from '@/context/themeContext';
import { useReminders } from '@/context/reminderContext';

const EARTH_RADIUS_METERS = 6371000;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function calculateDistanceMeters(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
) {
  const latDiff = toRadians(to.latitude - from.latitude);
  const lonDiff = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(lonDiff / 2) *
      Math.sin(lonDiff / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [currentCoordinates, setCurrentCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState('Locating...');
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const lastGeocodeAtRef = useRef(0);
  const { isDark } = useTheme();
  const router = useRouter();
  const { reminders, isLoading, error, toggleReminder, fetchReminders } = useReminders();

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const searchOpacity = useSharedValue(0);
  const searchScale = useSharedValue(0.95);
  const titleOpacity = useSharedValue(0);

  useEffect(() => {
    // Staggered animations
    headerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });

    setTimeout(() => {
      searchOpacity.value = withTiming(1, { duration: 500 });
      searchScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    }, 200);

    setTimeout(() => {
      titleOpacity.value = withTiming(1, { duration: 500 });
    }, 400);
  }, [headerOpacity, headerTranslateY, searchOpacity, searchScale, titleOpacity]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const searchAnimatedStyle = useAnimatedStyle(() => ({
    opacity: searchOpacity.value,
    transform: [{ scale: searchScale.value }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const filteredReminders = reminders.filter((reminder) =>
    reminder.title.toLowerCase().includes(search.toLowerCase()) ||
    reminder.location.toLowerCase().includes(search.toLowerCase())
  );

  const updateLocationLabel = React.useCallback(
    async (
      coordinates: { latitude: number; longitude: number },
      force = false
    ) => {
      const now = Date.now();
      if (!force && now - lastGeocodeAtRef.current < 60000) return;

      try {
        const reverse = await Location.reverseGeocodeAsync(coordinates);
        if (reverse.length > 0) {
          const first = reverse[0];
          const city = first.city || first.subregion || first.region;
          const country = first.isoCountryCode || first.country;
          setLocationLabel(city && country ? `${city}, ${country}` : city || country || 'Current location');
        } else {
          setLocationLabel('Current location');
        }
      } catch {
        setLocationLabel('Current location');
      } finally {
        lastGeocodeAtRef.current = now;
      }
    },
    []
  );

  const applyCoordinates = React.useCallback(
    (
      coords: { latitude: number; longitude: number },
      forceLabelUpdate = false
    ) => {
      const nextCoordinates = {
        latitude: coords.latitude,
        longitude: coords.longitude,
      };

      setCurrentCoordinates(nextCoordinates);
      void updateLocationLabel(nextCoordinates, forceLabelUpdate);
    },
    [updateLocationLabel]
  );

  const refreshCurrentLocation = React.useCallback(async () => {
    try {
      const existingPermission = await Location.getForegroundPermissionsAsync();
      const permission =
        existingPermission.status === 'granted'
          ? existingPermission
          : await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        setLocationLabel('Location permission off');
        setCurrentCoordinates(null);
        return;
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      applyCoordinates(currentPosition.coords, true);
    } catch {
      setLocationLabel('Location unavailable');
      setCurrentCoordinates(null);
    }
  }, [applyCoordinates]);

  const getDistanceLabel = React.useCallback(
    (item: (typeof reminders)[number]) => {
      if (!currentCoordinates) return '--';

      const meters = calculateDistanceMeters(currentCoordinates, item.coordinates);
      if (Number.isNaN(meters)) return '--';
      if (meters < 1000) return `${Math.round(meters)}m`;

      return `${(meters / 1000).toFixed(1)}km`;
    },
    [currentCoordinates]
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchReminders(), refreshCurrentLocation()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchReminders, refreshCurrentLocation]);

  useEffect(() => {
    refreshCurrentLocation();
  }, [refreshCurrentLocation]);

  useEffect(() => {
    let mounted = true;

    const startWatching = async () => {
      try {
        const existingPermission = await Location.getForegroundPermissionsAsync();
        const permission =
          existingPermission.status === 'granted'
            ? existingPermission
            : await Location.requestForegroundPermissionsAsync();

        if (!mounted) return;

        if (permission.status !== 'granted') {
          setIsLiveTracking(false);
          setLocationLabel('Location permission off');
          setCurrentCoordinates(null);
          return;
        }

        locationSubscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 25,
            timeInterval: 15000,
          },
          (position) => {
            if (!mounted) return;
            applyCoordinates(position.coords);
          }
        );
      } catch {
        setIsLiveTracking(false);
        if (!mounted) return;
        setLocationLabel('Location unavailable');
      }

      if (mounted) {
        setIsLiveTracking(!!locationSubscriptionRef.current);
      }
    };

    startWatching();

    return () => {
      mounted = false;
      locationSubscriptionRef.current?.remove();
      locationSubscriptionRef.current = null;
      setIsLiveTracking(false);
    };
  }, [applyCoordinates]);

  const handleToggleReminder = (id: string) => {
    toggleReminder(id);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-1">
        {/* Header */}
        <Animated.View style={headerAnimatedStyle} className="px-6 pt-4 pb-4 flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-foreground dark:text-foreground-dark text-3xl font-bold mb-2">
              {getGreeting()} 👋
            </Text>
            <View className="flex-row items-center">
              <MapPin size={16} color={'#00D4AA'} />
              <Text className="text-accent dark:text-accent-dark text-sm ml-1 font-bold tracking-wider uppercase">
                {locationLabel}
              </Text>
              {isLiveTracking ? (
                <View className="ml-2 px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/30">
                  <Text className="text-green-500 text-[10px] font-bold tracking-widest uppercase">Live</Text>
                </View>
              ) : null}
            </View>
          </View>
          <TouchableOpacity className="bg-card dark:bg-card-dark rounded-full p-3 border border-border dark:border-border-dark">
            <Bell color={isDark ? '#00D4AA' : '#1a1a1a'} size={20} />
          </TouchableOpacity>
        </Animated.View>

        {/* Search */}
        <Animated.View style={searchAnimatedStyle} className="px-6 pb-4">
          <View className="flex-row items-center bg-card dark:bg-card-dark rounded-2xl px-5 py-4">
            <Search size={20} className="text-muted-foreground dark:text-muted-foreground-dark" />
            <TextInput
              placeholder="Search reminders..."
              placeholderTextColor="#6B7280"
              value={search}
              onChangeText={setSearch}
              className="flex-1 ml-3 text-foreground dark:text-foreground-dark text-base"
            />
          </View>
        </Animated.View>

        {/* Active Reminders Title */}
        <Animated.View style={titleAnimatedStyle} className="px-6 pb-4 flex-row items-center justify-between">
          <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase tracking-[3px]">
            Active Proximities ({reminders.filter(r => r.enabled).length})
          </Text>
          <TouchableOpacity onPress={() => router.push('/add-reminder')}>
            <View className="flex-row items-center">
              <Plus size={16} color="#00D4AA" />
              <Text className="text-accent dark:text-accent-dark text-xs font-bold ml-1">Add New</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Reminders List */}
        <FlatList
          data={filteredReminders}
          keyExtractor={(item) => item.id}
          scrollEnabled
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#00D4AA"
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(index * 100).springify()}
              className="px-6 pb-4"
            >
              <View className="bg-card dark:bg-card-dark rounded-3xl p-5 border border-border dark:border-border-dark">
                {/* Top Section */}
                <View className="flex-row items-start justify-between mb-4">
                  <View className="flex-row items-start flex-1 mr-4">
                    <View className="bg-accent/20 dark:bg-accent-dark/20 rounded-2xl p-3 mr-3">
                      <Text className="text-3xl">{item.icon}</Text>
                    </View>
                    <View className="flex-1 pt-1">
                      <Text className="text-foreground dark:text-foreground-dark font-bold text-lg mb-1">
                        {item.title}
                      </Text>
                      <Text className="text-muted-foreground dark:text-muted-foreground-dark text-sm">
                        {item.location}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Toggle Switch */}
                  <TouchableOpacity
                    onPress={() => handleToggleReminder(item.id)}
                    className={`w-14 h-8 rounded-full p-1 ${
                      item.enabled 
                        ? 'bg-accent dark:bg-accent-dark' 
                        : 'bg-muted dark:bg-muted-dark'
                    }`}
                  >
                    <Animated.View
                      className="w-6 h-6 rounded-full bg-foreground dark:bg-foreground-dark"
                      style={{
                        transform: [{ translateX: item.enabled ? 24 : 0 }],
                      }}
                    />
                  </TouchableOpacity>
                </View>

                {/* Bottom Section */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View className="bg-muted dark:bg-muted-dark px-3 py-1.5 rounded-lg">
                      <Text className="text-foreground dark:text-foreground-dark text-xs font-bold tracking-wider uppercase">
                        {getDistanceLabel(item)} away
                      </Text>
                    </View>
                    <View className="bg-accent/10 dark:bg-accent-dark/10 px-3 py-1.5 rounded-lg">
                      <Text className="text-accent dark:text-accent-dark text-xs font-bold">
                        {item.radius}m radius
                      </Text>
                    </View>
                  </View>
                  <Text className="text-muted-foreground dark:text-muted-foreground-dark text-sm italic">
                    {item.frequency === 'once' ? 'Once' : 'Always'}
                  </Text>
                </View>

                {/* Triggered Badge */}
                {item.triggered && item.frequency === 'once' && (
                  <View className="mt-3 bg-green-500/20 px-3 py-2 rounded-lg flex-row items-center">
                    <Check size={14} color="#22c55e" style={{ marginRight: 6 }} />
                    <Text className="text-green-500 text-xs font-bold">Completed</Text>
                  </View>
                )}

                {/* Disabled State Overlay */}
                {!item.enabled && (
                  <View className="absolute top-0 left-0 right-0 bottom-0 bg-background/50 dark:bg-background-dark/50 rounded-3xl items-center justify-center">
                    <View className="bg-muted dark:bg-muted-dark px-4 py-2 rounded-lg">
                      <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold tracking-widest uppercase">
                        Disabled
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </Animated.View>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-12 px-6">
              <View className="bg-card dark:bg-card-dark rounded-3xl p-8 items-center w-full">
                <MapPin size={48} color="#00D4AA" />
                <Text className="text-foreground dark:text-foreground-dark font-bold text-lg mt-4 mb-2">
                  No reminders yet
                </Text>
                <Text className="text-muted-foreground dark:text-muted-foreground-dark text-center mb-4">
                  Create your first location-based reminder
                </Text>
                <TouchableOpacity 
                  onPress={() => router.push('/add-reminder')}
                  className="bg-accent dark:bg-accent-dark px-6 py-3 rounded-full flex-row items-center"
                >
                  <Plus size={18} color={isDark ? '#1a1a1a' : '#ffffff'} style={{ marginRight: 6 }} />
                  <Text className="text-accent-foreground dark:text-accent-foreground-dark font-bold">
                    Add Reminder
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          }
        />

        {isLoading && reminders.length > 0 ? (
          <View className="absolute top-4 right-6 rounded-full bg-card dark:bg-card-dark px-3 py-1.5 border border-border dark:border-border-dark flex-row items-center">
            <ActivityIndicator size="small" color="#00D4AA" />
            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs ml-2">Syncing</Text>
          </View>
        ) : null}

        {error ? (
          <View className="px-6 pb-4">
            <View className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3">
              <Text className="text-rose-500 text-sm">{error}</Text>
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}