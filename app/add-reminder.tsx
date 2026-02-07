import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  SlideInUp,
  FadeInDown,
} from 'react-native-reanimated';
import { X, Check, Clock, Repeat, Repeat1 } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/context/themeContext';
import { useReminders } from '@/context/reminderContext';
import Svg, { Circle, G, Rect, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_SIZE = SCREEN_WIDTH - 80;

type AddReminderScreenProps = {
  onBack?: () => void;
};

export default function AddReminderScreen({ onBack }: AddReminderScreenProps) {
  const [title, setTitle] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationIcon, setLocationIcon] = useState('📍');
  const [radius, setRadius] = useState(300);
  const [frequency, setFrequency] = useState<'once' | 'always'>('once');
  const [useTimeframe, setUseTimeframe] = useState(false);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('20:00');
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  const { isDark } = useTheme();
  const { addReminder } = useReminders();
  const params = useLocalSearchParams<{ 
    selectedLocation?: string; 
    selectedAddress?: string;
    selectedLat?: string;
    selectedLon?: string;
    selectedIcon?: string;
  }>();

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.95);

  // Handle selected location from location-picker
  useEffect(() => {
    if (params.selectedLocation) {
      setLocationName(params.selectedLocation);
      setLocationAddress(params.selectedAddress || '');
      if (params.selectedLat && params.selectedLon) {
        const coords = {
          latitude: parseFloat(params.selectedLat),
          longitude: parseFloat(params.selectedLon),
        };
        setLocationCoords(coords);
      }
      if (params.selectedIcon) {
        setLocationIcon(params.selectedIcon);
      }
    }
  }, [params.selectedLocation, params.selectedAddress, params.selectedLat, params.selectedLon, params.selectedIcon]);

  useEffect(() => {
    // Staggered entrance animations
    headerOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });

    setTimeout(() => {
      buttonOpacity.value = withTiming(1, { duration: 500 });
      buttonScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    }, 400);
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  const radiusOptions = [100, 300, 500];

  // Map configuration for preview
  const MAP_CONFIG = {
    minLat: 9.0300,
    maxLat: 9.1000,
    minLon: 7.3800,
    maxLon: 7.5200,
  };

  // Convert coordinates to map position
  const coordsToMapPosition = (lat: number, lon: number) => {
    const x = ((lon - MAP_CONFIG.minLon) / (MAP_CONFIG.maxLon - MAP_CONFIG.minLon)) * MAP_SIZE;
    const y = ((MAP_CONFIG.maxLat - lat) / (MAP_CONFIG.maxLat - MAP_CONFIG.minLat)) * MAP_SIZE;
    return { x, y };
  };

  // Get location position for map
  const locationPos = locationCoords 
    ? coordsToMapPosition(locationCoords.latitude, locationCoords.longitude)
    : { x: MAP_SIZE / 2, y: MAP_SIZE / 2 };

  // Calculate radius in pixels for map display
  const radiusInPixels = (radius / 1000) * (MAP_SIZE / 0.14);

  const handleSave = () => {
    if (title && locationCoords) {
      addReminder({
        title,
        location: locationName,
        address: locationAddress,
        distance: '--',
        radius,
        enabled: true,
        icon: locationIcon,
        frequency,
        timeframe: useTimeframe ? { startTime, endTime } : undefined,
        coordinates: locationCoords,
      });

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        router.back(); // Navigate back to home after saving
      }, 1500);
    }
  };



  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          {/* Header */}
          <Animated.View style={headerAnimatedStyle} className="flex-row items-center justify-between mb-8">
            <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
              <X size={24} color={isDark ? '#00D4AA' : '#1a1a1a'} />
            </TouchableOpacity>
            <Text 
              className="text-foreground dark:text-foreground-dark text-lg font-bold tracking-[3px] uppercase"
              style={{ fontFamily: 'Courier' }}
            >
              New Reminder
            </Text>
            <View className="w-10" />
          </Animated.View>

          {/* Reminder Title */}
          <Animated.View entering={FadeInDown.delay(100).springify()} className="mb-6">
            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase mb-3 tracking-[2px]">
              What&apos;s the plan?
            </Text>
            <TextInput
              placeholder="Remind me to..."
              placeholderTextColor="#6B7280"
              value={title}
              onChangeText={setTitle}
              className="w-full bg-card dark:bg-card-dark px-5 py-4 text-xl text-foreground dark:text-foreground-dark rounded-2xl"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </Animated.View>

          {/* Location */}
          <Animated.View entering={FadeInDown.delay(200).springify()} className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase tracking-[2px]">
                Location
              </Text>
              <TouchableOpacity onPress={() => router.push('/location-picker')}>
                <Text className="text-accent dark:text-accent-dark text-sm font-bold">
                  Change
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              onPress={() => router.push('/location-picker')}
              className="flex-row items-center bg-card dark:bg-card-dark px-5 py-4 rounded-2xl"
            >
              <View className="bg-accent/20 dark:bg-accent-dark/20 rounded-full p-3 mr-4 items-center justify-center">
                <Text className="text-2xl">{locationIcon}</Text>
              </View>
              <View className="flex-1">
                <Text className="font-bold text-foreground dark:text-foreground-dark text-base mb-1">
                  {locationName || 'Select a location'}
                </Text>
                <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                  {locationAddress || 'Tap to choose'}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Repeat Options */}
          <Animated.View entering={FadeInDown.delay(300).springify()} className="mb-6">
            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase mb-3 tracking-[2px]">
              Repeat
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setFrequency('once')}
                className={`flex-1 flex-row items-center justify-center rounded-2xl py-4 ${
                  frequency === 'once' 
                    ? 'bg-accent dark:bg-accent-dark' 
                    : 'bg-card dark:bg-card-dark border border-border dark:border-border-dark'
                }`}
              >
                <Repeat1 
                  size={20} 
                  color={frequency === 'once' ? (isDark ? '#1a1a1a' : '#ffffff') : (isDark ? '#9CA3AF' : '#6B7280')}
                  style={{ marginRight: 8 }}
                />
                <Text
                  className={`font-bold text-base ${
                    frequency === 'once' 
                      ? 'text-accent-foreground dark:text-accent-foreground-dark' 
                      : 'text-muted-foreground dark:text-muted-foreground-dark'
                  }`}
                >
                  Once
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setFrequency('always')}
                className={`flex-1 flex-row items-center justify-center rounded-2xl py-4 ${
                  frequency === 'always' 
                    ? 'bg-accent dark:bg-accent-dark' 
                    : 'bg-card dark:bg-card-dark border border-border dark:border-border-dark'
                }`}
              >
                <Repeat 
                  size={20} 
                  color={frequency === 'always' ? (isDark ? '#1a1a1a' : '#ffffff') : (isDark ? '#9CA3AF' : '#6B7280')}
                  style={{ marginRight: 8 }}
                />
                <Text
                  className={`font-bold text-base ${
                    frequency === 'always' 
                      ? 'text-accent-foreground dark:text-accent-foreground-dark' 
                      : 'text-muted-foreground dark:text-muted-foreground-dark'
                  }`}
                >
                  Always
                </Text>
              </TouchableOpacity>
            </View>
            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs mt-2 text-center">
              {frequency === 'once' ? 'Triggers once then auto-disables' : 'Triggers every time you enter the area'}
            </Text>
          </Animated.View>

          {/* Timeframe */}
          <Animated.View entering={FadeInDown.delay(400).springify()} className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase tracking-[2px]">
                Time Frame
              </Text>
              <TouchableOpacity
                onPress={() => setUseTimeframe(!useTimeframe)}
                className={`w-14 h-8 rounded-full p-1 ${
                  useTimeframe 
                    ? 'bg-accent dark:bg-accent-dark' 
                    : 'bg-muted dark:bg-muted-dark'
                }`}
              >
                <Animated.View
                  className="w-6 h-6 rounded-full bg-foreground dark:bg-foreground-dark"
                  style={{
                    transform: [{ translateX: useTimeframe ? 24 : 0 }],
                  }}
                />
              </TouchableOpacity>
            </View>
            
            {useTimeframe && (
              <View className="bg-card dark:bg-card-dark rounded-2xl p-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 items-center">
                    <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs mb-2">FROM</Text>
                    <View className="flex-row items-center bg-background dark:bg-background-dark rounded-xl px-4 py-3">
                      <Clock size={16} color="#00D4AA" style={{ marginRight: 8 }} />
                      <TextInput
                        value={startTime}
                        onChangeText={setStartTime}
                        placeholder="08:00"
                        placeholderTextColor="#6B7280"
                        className="text-foreground dark:text-foreground-dark text-lg font-bold w-16 text-center"
                      />
                    </View>
                  </View>
                  <Text className="text-muted-foreground dark:text-muted-foreground-dark mx-4">—</Text>
                  <View className="flex-1 items-center">
                    <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs mb-2">TO</Text>
                    <View className="flex-row items-center bg-background dark:bg-background-dark rounded-xl px-4 py-3">
                      <Clock size={16} color="#00D4AA" style={{ marginRight: 8 }} />
                      <TextInput
                        value={endTime}
                        onChangeText={setEndTime}
                        placeholder="20:00"
                        placeholderTextColor="#6B7280"
                        className="text-foreground dark:text-foreground-dark text-lg font-bold w-16 text-center"
                      />
                    </View>
                  </View>
                </View>
                <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs mt-3 text-center">
                  Only trigger notifications during this time
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Proximity Radius */}
          <Animated.View entering={FadeInDown.delay(500).springify()} className="mb-6">
            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase mb-3 tracking-[2px]">
              Proximity Radius
            </Text>

            {/* Radius Buttons */}
            <View className="flex-row gap-3 mb-4">
              {radiusOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => setRadius(option)}
                  className={`flex-1 rounded-2xl py-4 items-center ${
                    radius === option 
                      ? 'bg-accent dark:bg-accent-dark' 
                      : 'bg-card dark:bg-card-dark border border-border dark:border-border-dark'
                  }`}
                >
                  <Text
                    className={`font-bold text-base ${
                      radius === option 
                        ? 'text-accent-foreground dark:text-accent-foreground-dark' 
                        : 'text-muted-foreground dark:text-muted-foreground-dark'
                    }`}
                  >
                    {option}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Map Visualization with Location */}
            <View className="bg-card dark:bg-card-dark rounded-2xl p-4 items-center justify-center relative">
              <Svg width={MAP_SIZE} height={MAP_SIZE} viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}>
                <Defs>
                  <LinearGradient id="mapGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor={isDark ? '#1f2937' : '#f3f4f6'} />
                    <Stop offset="100%" stopColor={isDark ? '#111827' : '#e5e7eb'} />
                  </LinearGradient>
                </Defs>
                
                {/* Map Background */}
                <Rect x="0" y="0" width={MAP_SIZE} height={MAP_SIZE} fill="url(#mapGradient2)" rx={12} />
                
                {/* Grid */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <G key={`grid2-${i}`}>
                    <Circle
                      cx={(i + 1) * (MAP_SIZE / 8)}
                      cy={(i + 1) * (MAP_SIZE / 8)}
                      r={2}
                      fill={isDark ? '#374151' : '#d1d5db'}
                    />
                  </G>
                ))}

                {/* Location with radius */}
                {locationCoords && (
                  <G>
                    {/* Radius circle */}
                    <Circle
                      cx={locationPos.x}
                      cy={locationPos.y}
                      r={Math.min(radiusInPixels, MAP_SIZE / 2 - 20)}
                      fill="#00D4AA"
                      fillOpacity={0.15}
                      stroke="#00D4AA"
                      strokeWidth={2}
                      strokeDasharray="8,4"
                    />
                    {/* Location marker */}
                    <Circle
                      cx={locationPos.x}
                      cy={locationPos.y}
                      r={16}
                      fill="#00D4AA"
                    />
                    <SvgText
                      x={locationPos.x}
                      y={locationPos.y + 5}
                      textAnchor="middle"
                      fontSize={12}
                    >
                      {locationIcon}
                    </SvgText>
                  </G>
                )}

                {/* No location placeholder */}
                {!locationCoords && (
                  <SvgText
                    x={MAP_SIZE / 2}
                    y={MAP_SIZE / 2}
                    textAnchor="middle"
                    fontSize={12}
                    fill={isDark ? '#9CA3AF' : '#6B7280'}
                  >
                    Select a location
                  </SvgText>
                )}
              </Svg>

              {/* Radius indicator */}
              <View className="absolute top-4 left-4 bg-accent/90 dark:bg-accent-dark/90 px-3 py-1 rounded-full">
                <Text className="text-accent-foreground dark:text-accent-foreground-dark text-xs font-bold">
                  {radius}m radius
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <Animated.View style={buttonAnimatedStyle} className="px-6 pb-8">
        <TouchableOpacity
          onPress={handleSave}
          disabled={!title || !locationCoords}
          className={`rounded-full py-5 items-center flex-row justify-center ${
            !title || !locationCoords
              ? 'bg-muted dark:bg-muted-dark' 
              : 'bg-accent dark:bg-accent-dark'
          }`}
        >
          <Check 
            size={24} 
            color={!title || !locationCoords ? '#6B7280' : (isDark ? '#1a1a1a' : '#ffffff')}
            style={{ marginRight: 8 }}
          />
          <Text
            className={`font-bold text-lg ${
              !title || !locationCoords
                ? 'text-muted-foreground dark:text-muted-foreground-dark' 
                : 'text-accent-foreground dark:text-accent-foreground-dark'
            }`}
          >
            Save Reminder
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Success Modal */}
      <Modal transparent visible={saved} animationType="fade">
        <View className="flex-1 bg-background/80 dark:bg-background-dark/80 items-center justify-center">
          <Animated.View 
            entering={SlideInUp.springify()} 
            className="bg-accent dark:bg-accent-dark rounded-3xl px-8 py-5 items-center mx-6"
          >
            <View className="flex-row items-center">
              <Check size={24} color={isDark ? '#1a1a1a' : '#ffffff'} style={{ marginRight: 8 }} />
              <Text className="text-accent-foreground dark:text-accent-foreground-dark font-bold text-xl">
                Reminder Saved!
              </Text>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}