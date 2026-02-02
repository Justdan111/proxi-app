import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  SlideInUp,
} from 'react-native-reanimated';
import { X, MapPin, Plus, Minus, Check } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/themeContext';

type AddReminderScreenProps = {
  onBack?: () => void;
};

export default function AddReminderScreen({ onBack }: AddReminderScreenProps) {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('Coffee Collective');
  const [radius, setRadius] = useState('100m');
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  const { isDark } = useTheme();

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const locationOpacity = useSharedValue(0);
  const locationTranslateY = useSharedValue(20);
  const radiusOpacity = useSharedValue(0);
  const radiusTranslateY = useSharedValue(20);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.95);

  useEffect(() => {
    // Staggered entrance animations
    headerOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });

    setTimeout(() => {
      titleOpacity.value = withTiming(1, { duration: 500 });
      titleTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    }, 100);

    setTimeout(() => {
      locationOpacity.value = withTiming(1, { duration: 500 });
      locationTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    }, 200);

    setTimeout(() => {
      radiusOpacity.value = withTiming(1, { duration: 500 });
      radiusTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    }, 300);

    setTimeout(() => {
      buttonOpacity.value = withTiming(1, { duration: 500 });
      buttonScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    }, 400);
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const locationAnimatedStyle = useAnimatedStyle(() => ({
    opacity: locationOpacity.value,
    transform: [{ translateY: locationTranslateY.value }],
  }));

  const radiusAnimatedStyle = useAnimatedStyle(() => ({
    opacity: radiusOpacity.value,
    transform: [{ translateY: radiusTranslateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  const radiusOptions = ['100m', '300m', '500m'];

  const handleSave = () => {
    if (title) {
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        router.back();
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
          <Animated.View style={titleAnimatedStyle} className="mb-8">
            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase mb-4 tracking-[2px]">
              What&apos;s the plan?
            </Text>
            <TextInput
              placeholder="Remind me to..."
              placeholderTextColor="#6B7280"
              value={title}
              onChangeText={setTitle}
              className="w-full bg-card dark:bg-card-dark px-5 py-4 text-xl text-foreground dark:text-foreground-dark rounded-2xl"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </Animated.View>

          {/* Location */}
          <Animated.View style={locationAnimatedStyle} className="mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase tracking-[2px]">
                Location
              </Text>
              <TouchableOpacity>
                <Text className="text-accent dark:text-accent-dark text-sm font-bold">
                  Change
                </Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center bg-card dark:bg-card-dark px-5 py-4 rounded-2xl">
              <View className="bg-accent/20 dark:bg-accent-dark/20 rounded-full p-3 mr-4 items-center justify-center">
                <MapPin size={20} color="#00D4AA" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-foreground dark:text-foreground-dark text-base mb-1">
                  {location}
                </Text>
                <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                Abuja Nigeria
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Proximity Radius */}
          <Animated.View style={radiusAnimatedStyle} className="mb-8">
            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase mb-4 tracking-[2px]">
              Proximity Radius
            </Text>

            {/* Radius Buttons */}
            <View className="flex-row gap-3 mb-6">
              {radiusOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => setRadius(option)}
                  className={`flex-1 rounded-2xl py-4 items-center ${
                    radius === option 
                      ? 'bg-card dark:bg-card-dark border-2 border-accent dark:border-accent-dark' 
                      : 'bg-card dark:bg-card-dark'
                  }`}
                >
                  <Text
                    className={`font-bold text-base ${
                      radius === option 
                        ? 'text-foreground dark:text-foreground-dark' 
                        : 'text-muted-foreground dark:text-muted-foreground-dark'
                    }`}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Radius Visualization */}
            <View className="bg-card dark:bg-card-dark rounded-2xl p-6 items-center justify-center h-80 relative">
              <Svg width={300} height={300} viewBox="0 0 300 300">
                {/* Grid dots pattern */}
                {Array.from({ length: 15 }).map((_, row) =>
                  Array.from({ length: 15 }).map((_, col) => {
                    const x = 30 + col * 18;
                    const y = 30 + row * 18;
                    const distanceFromCenter = Math.sqrt(
                      Math.pow(x - 150, 2) + Math.pow(y - 150, 2)
                    );
                    // Only show dots outside the radius circle
                    if (distanceFromCenter > 100) {
                      return (
                        <Circle
                          key={`${row}-${col}`}
                          cx={x}
                          cy={y}
                          r="1.5"
                          fill="#4B5563"
                          opacity={0.4}
                        />
                      );
                    }
                    return null;
                  })
                )}
                
                {/* Radius circle with gradient fill */}
                <Circle
                  cx="150"
                  cy="150"
                  r="100"
                  fill="#00D4AA"
                  fillOpacity={0.1}
                  stroke="#00D4AA"
                  strokeWidth="2"
                />
                
                {/* Center point */}
                <Circle cx="150" cy="150" r="8" fill="#00D4AA" />
              </Svg>

              {/* Zoom controls */}
              <View className="absolute bottom-4 right-4 gap-2">
                <TouchableOpacity className="bg-background dark:bg-background-dark rounded-xl p-3 border border-border dark:border-border-dark">
                  <Plus size={20} color={isDark ? '#ffffff' : '#1a1a1a'} />
                </TouchableOpacity>
                <TouchableOpacity className="bg-background dark:bg-background-dark rounded-xl p-3 border border-border dark:border-border-dark">
                  <Minus size={20} color={isDark ? '#ffffff' : '#1a1a1a'} />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <Animated.View style={buttonAnimatedStyle} className="px-6 pb-8">
        <TouchableOpacity
          onPress={handleSave}
          disabled={!title}
          className={`rounded-full py-5 items-center flex-row justify-center ${
            !title 
              ? 'bg-muted dark:bg-muted-dark' 
              : 'bg-accent dark:bg-accent-dark'
          }`}
        >
          <Check 
            size={24} 
            color={!title ? '#6B7280' : (isDark ? '#1a1a1a' : '#ffffff')}
            style={{ marginRight: 8 }}
          />
          <Text
            className={`font-bold text-lg ${
              !title 
                ? 'text-muted-foreground dark:text-muted-foreground-dark' 
                : 'text-accent-foreground dark:text-accent-foreground-dark'
            }`}
          >
            Save Reminder
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Success Modal */}
      <Modal transparent visible={saved}  animationType="fade">
        <View className="flex-1 bg-background/80 dark:bg-background-dark/80 items-center justify-center">
          <Animated.View 
            entering={SlideInUp.springify()} 
            className="bg-accent dark:bg-accent-dark rounded-3xl px-8 py-5 items-center mx-6"
          >
            <View className="flex-row items-center">
              <Check size={24} color={isDark ? '#1a1a1a' : '#ffffff'} style={{ marginRight: 8 }} />
              <Text className="text-accent-foreground dark:text-accent-foreground-dark font-bold text-xl">
                Reminder Saved
              </Text>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}