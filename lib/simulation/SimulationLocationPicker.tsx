import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
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
  ArrowLeft,
  MapPin,
  Target,
  ZoomIn,
  ZoomOut,
  Crosshair,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/themeContext';
import { useReminders, TestLocation } from '@/context/reminderContext';
import Svg, { Circle, Line, Rect, Text as SvgText, G, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_SIZE = SCREEN_WIDTH - 48;

// Map configuration for test case
const MAP_CONFIG = {
  // Abuja area bounds
  minLat: 9.0300,
  maxLat: 9.1000,
  minLon: 7.3800,
  maxLon: 7.5200,
};

export default function LocationPickerScreen() {
  const [search, setSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<TestLocation | null>(null);
  const [, setMapZoom] = useState(1);
  const [searchResults, setSearchResults] = useState<TestLocation[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const router = useRouter();
  const { isDark } = useTheme();
  const { currentSimulatedLocation, testLocations: locations } = useReminders();

  // Animation values
  const headerOpacity = useSharedValue(0);
  const mapOpacity = useSharedValue(0);
  const mapScale = useSharedValue(0.95);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
    mapOpacity.value = withTiming(1, { duration: 600 });
    mapScale.value = withSpring(1, { damping: 12, stiffness: 100 });
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const mapAnimatedStyle = useAnimatedStyle(() => ({
    opacity: mapOpacity.value,
    transform: [{ scale: mapScale.value }],
  }));

  // Convert coordinates to map position
  const coordsToMapPosition = (lat: number, lon: number) => {
    const x = ((lon - MAP_CONFIG.minLon) / (MAP_CONFIG.maxLon - MAP_CONFIG.minLon)) * MAP_SIZE;
    const y = ((MAP_CONFIG.maxLat - lat) / (MAP_CONFIG.maxLat - MAP_CONFIG.minLat)) * MAP_SIZE;
    return { x, y };
  };

  // Search handler
  const handleSearch = (text: string) => {
    setSearch(text);
    if (text.length > 0) {
      const results = locations.filter(loc => 
        loc.name.toLowerCase().includes(text.toLowerCase()) ||
        loc.address.toLowerCase().includes(text.toLowerCase()) ||
        loc.category.toLowerCase().includes(text.toLowerCase())
      );
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Select location
  const handleSelectLocation = (location: TestLocation) => {
    setSelectedLocation(location);
    setShowSearchResults(false);
    setSearch(location.name);
  };

  // Confirm selection and navigate back
  const confirmSelection = () => {
    if (selectedLocation) {
      router.push({
        pathname: '/add-reminder',
        params: {
          selectedLocation: selectedLocation.name,
          selectedAddress: selectedLocation.address,
          selectedLat: selectedLocation.coordinates.latitude.toString(),
          selectedLon: selectedLocation.coordinates.longitude.toString(),
          selectedIcon: selectedLocation.icon,
        },
      });
    }
  };

  // Get user position on map
  const userMapPosition = currentSimulatedLocation 
    ? coordsToMapPosition(currentSimulatedLocation.latitude, currentSimulatedLocation.longitude)
    : coordsToMapPosition(9.0765, 7.3986);

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
        <Animated.View entering={FadeInDown.delay(100).springify()} className="mb-4 relative z-20">
          <View className="flex-row items-center bg-card dark:bg-card-dark rounded-2xl px-5 py-4 border border-border dark:border-border-dark">
            <Search size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            <TextInput
              placeholder="Search locations..."
              placeholderTextColor="#6B7280"
              value={search}
              onChangeText={handleSearch}
              className="flex-1 ml-3 text-foreground dark:text-foreground-dark text-base"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Text className="text-accent dark:text-accent-dark font-bold">Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <View className="absolute top-full left-0 right-0 bg-card dark:bg-card-dark rounded-2xl mt-2 border border-border dark:border-border-dark overflow-hidden z-50">
              {searchResults.map((result, index) => (
                <TouchableOpacity 
                  key={result.id}
                  onPress={() => handleSelectLocation(result)}
                  className={`flex-row items-center px-4 py-3 ${index < searchResults.length - 1 ? 'border-b border-border dark:border-border-dark' : ''}`}
                >
                  <Text className="text-2xl mr-3">{result.icon}</Text>
                  <View className="flex-1">
                    <Text className="text-foreground dark:text-foreground-dark font-semibold">{result.name}</Text>
                    <Text className="text-muted-foreground dark:text-muted-foreground-dark text-sm">{result.address}</Text>
                  </View>
                  <MapPin size={16} color="#00D4AA" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Test Map Section */}
        <Animated.View style={mapAnimatedStyle} entering={FadeInDown.delay(200).springify()} className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase tracking-[2px]">
              Test Map View
            </Text>
            <View className="flex-row items-center bg-accent/20 dark:bg-accent-dark/20 px-3 py-1 rounded-full">
              <Crosshair size={12} color="#00D4AA" />
              <Text className="text-accent dark:text-accent-dark text-xs ml-1 font-bold">SIMULATION MODE</Text>
            </View>
          </View>
          
          <View className="bg-card dark:bg-card-dark rounded-2xl p-4 border border-border dark:border-border-dark">
            {/* SVG Map */}
            <View className="items-center justify-center">
              <Svg width={MAP_SIZE} height={MAP_SIZE} viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}>
                <Defs>
                  <LinearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor={isDark ? '#1f2937' : '#f3f4f6'} />
                    <Stop offset="100%" stopColor={isDark ? '#111827' : '#e5e7eb'} />
                  </LinearGradient>
                </Defs>
                
                {/* Map Background */}
                <Rect x="0" y="0" width={MAP_SIZE} height={MAP_SIZE} fill="url(#mapGradient)" rx={12} />
                
                {/* Grid Lines */}
                {Array.from({ length: 10 }).map((_, i) => (
                  <G key={`grid-${i}`}>
                    <Line
                      x1={0}
                      y1={(i + 1) * (MAP_SIZE / 10)}
                      x2={MAP_SIZE}
                      y2={(i + 1) * (MAP_SIZE / 10)}
                      stroke={isDark ? '#374151' : '#d1d5db'}
                      strokeWidth="0.5"
                      strokeDasharray="4,4"
                    />
                    <Line
                      x1={(i + 1) * (MAP_SIZE / 10)}
                      y1={0}
                      x2={(i + 1) * (MAP_SIZE / 10)}
                      y2={MAP_SIZE}
                      stroke={isDark ? '#374151' : '#d1d5db'}
                      strokeWidth="0.5"
                      strokeDasharray="4,4"
                    />
                  </G>
                ))}

                {/* Roads (simplified) */}
                <Path
                  d={`M 0 ${MAP_SIZE / 2} L ${MAP_SIZE} ${MAP_SIZE / 2}`}
                  stroke={isDark ? '#4b5563' : '#9ca3af'}
                  strokeWidth="6"
                />
                <Path
                  d={`M ${MAP_SIZE / 2} 0 L ${MAP_SIZE / 2} ${MAP_SIZE}`}
                  stroke={isDark ? '#4b5563' : '#9ca3af'}
                  strokeWidth="6"
                />
                <Path
                  d={`M ${MAP_SIZE * 0.25} 0 L ${MAP_SIZE * 0.75} ${MAP_SIZE}`}
                  stroke={isDark ? '#374151' : '#d1d5db'}
                  strokeWidth="3"
                />

                {/* Location Markers */}
                {locations.map(location => {
                  const pos = coordsToMapPosition(location.coordinates.latitude, location.coordinates.longitude);
                  const isSelected = selectedLocation?.id === location.id;
                  
                  return (
                    <G key={location.id}>
                      {/* Marker Shadow */}
                      <Circle
                        cx={pos.x}
                        cy={pos.y + 2}
                        r={isSelected ? 18 : 14}
                        fill="rgba(0,0,0,0.2)"
                      />
                      {/* Marker Background */}
                      <Circle
                        cx={pos.x}
                        cy={pos.y}
                        r={isSelected ? 18 : 14}
                        fill={isSelected ? '#00D4AA' : (isDark ? '#374151' : '#e5e7eb')}
                        stroke={isSelected ? '#00D4AA' : '#6b7280'}
                        strokeWidth="2"
                      />
                      {/* Marker Icon (using text as placeholder) */}
                      <SvgText
                        x={pos.x}
                        y={pos.y + 5}
                        textAnchor="middle"
                        fontSize={isSelected ? 14 : 12}
                      >
                        {location.icon}
                      </SvgText>
                    </G>
                  );
                })}

                {/* User Location */}
                <G>
                  {/* User Location Pulse */}
                  <Circle
                    cx={userMapPosition.x}
                    cy={userMapPosition.y}
                    r={24}
                    fill="#3B82F6"
                    fillOpacity={0.2}
                  />
                  <Circle
                    cx={userMapPosition.x}
                    cy={userMapPosition.y}
                    r={16}
                    fill="#3B82F6"
                    fillOpacity={0.3}
                  />
                  {/* User Marker */}
                  <Circle
                    cx={userMapPosition.x}
                    cy={userMapPosition.y}
                    r={10}
                    fill="#3B82F6"
                    stroke="#ffffff"
                    strokeWidth="3"
                  />
                </G>
              </Svg>
            </View>

            {/* Map Controls */}
            <View className="absolute bottom-6 right-6 gap-2">
              <TouchableOpacity 
                onPress={() => setMapZoom(prev => Math.min(prev + 0.2, 2))}
                className="bg-background dark:bg-background-dark rounded-xl p-3 border border-border dark:border-border-dark"
              >
                <ZoomIn size={18} color={isDark ? '#ffffff' : '#1a1a1a'} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setMapZoom(prev => Math.max(prev - 0.2, 0.5))}
                className="bg-background dark:bg-background-dark rounded-xl p-3 border border-border dark:border-border-dark"
              >
                <ZoomOut size={18} color={isDark ? '#ffffff' : '#1a1a1a'} />
              </TouchableOpacity>
            </View>

            {/* Map Legend */}
            <View className="flex-row items-center justify-center mt-4 gap-4">
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-blue-500 mr-1" />
                <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs">You</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-accent dark:bg-accent-dark mr-1" />
                <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs">Selected</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-gray-500 mr-1" />
                <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs">Location</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Quick Select Locations */}
        <Animated.View entering={FadeInDown.delay(300).springify()} className="mb-6">
          <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase tracking-[2px] mb-3">
            Available Test Locations
          </Text>
          
          <View className="gap-2">
            {locations.map((location, index) => (
              <Animated.View
                key={location.id}
                entering={FadeInDown.delay(400 + index * 50).springify()}
              >
                <TouchableOpacity 
                  onPress={() => handleSelectLocation(location)}
                  className={`flex-row items-center bg-card dark:bg-card-dark rounded-2xl px-4 py-3 border ${
                    selectedLocation?.id === location.id 
                      ? 'border-accent dark:border-accent-dark' 
                      : 'border-border dark:border-border-dark'
                  }`}
                >
                  <View className={`rounded-xl p-2 mr-3 ${
                    selectedLocation?.id === location.id 
                      ? 'bg-accent/20 dark:bg-accent-dark/20' 
                      : 'bg-muted dark:bg-muted-dark'
                  }`}>
                    <Text className="text-xl">{location.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className={`font-semibold ${
                      selectedLocation?.id === location.id 
                        ? 'text-accent dark:text-accent-dark' 
                        : 'text-foreground dark:text-foreground-dark'
                    }`}>
                      {location.name}
                    </Text>
                    <Text className="text-muted-foreground dark:text-muted-foreground-dark text-sm">
                      {location.address}
                    </Text>
                  </View>
                  {selectedLocation?.id === location.id && (
                    <View className="bg-accent dark:bg-accent-dark rounded-full p-1">
                      <Target size={16} color={isDark ? '#1a1a1a' : '#ffffff'} />
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Bottom spacing */}
        <View className="h-24" />
      </ScrollView>

      {/* Confirm Button */}
      {selectedLocation && (
        <Animated.View 
          entering={FadeInDown.springify()}
          className="px-6 pb-8 absolute bottom-0 left-0 right-0 bg-background dark:bg-background-dark"
        >
          <TouchableOpacity
            onPress={confirmSelection}
            className="bg-accent dark:bg-accent-dark rounded-full py-4 items-center flex-row justify-center"
          >
            <MapPin size={20} color={isDark ? '#1a1a1a' : '#ffffff'} style={{ marginRight: 8 }} />
            <Text className="text-accent-foreground dark:text-accent-foreground-dark font-bold text-lg">
              Confirm: {selectedLocation.name}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}
