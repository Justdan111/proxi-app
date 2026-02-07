import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { MapPin } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/context/themeContext';
import { useReminders } from '@/context/reminderContext';

export default function NotificationScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { markReminderTriggered } = useReminders();
  const params = useLocalSearchParams<{
    alertId?: string;
    reminderId?: string;
    reminderTitle?: string;
    locationName?: string;
    distance?: string;
    icon?: string;
  }>();

  const reminderTitle = params.reminderTitle || "Don't forget to buy fuel.";
  const locationName = params.locationName || "Shell Gas Station";
  const distance = params.distance || "0m away";
  const reminderId = params.reminderId || "";
  const icon = params.icon || "📍";

  // Animation values
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const dotsOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    // Logo animation
    logoScale.value = withSpring(1, { damping: 10, stiffness: 100 });
    logoOpacity.value = withTiming(1, { duration: 600 });

    // Dots fade in
    setTimeout(() => {
      dotsOpacity.value = withTiming(1, { duration: 800 });
    }, 300);

    // Card animation
    setTimeout(() => {
      cardOpacity.value = withTiming(1, { duration: 500 });
      cardScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    }, 600);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const dotsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: dotsOpacity.value,
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const handleMarkDone = () => {
    // Mark the reminder as triggered/completed
    if (reminderId) {
      markReminderTriggered(reminderId);
    }
    router.back();
  };

  const handleDismiss = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-1 items-center justify-center px-6">
        {/* Logo */}
        <Animated.View style={logoAnimatedStyle} className="items-center mb-8">
          <View className="bg-accent dark:bg-accent-dark rounded-3xl p-6 mb-4">
            <MapPin size={48} color={isDark ? '#1a1a1a' : '#ffffff'} />
          </View>
          <Text
            className="text-muted-foreground dark:text-muted-foreground-dark text-sm tracking-[4px] uppercase"
            style={{ fontFamily: 'Courier' }}
          >
            Proxi
          </Text>
        </Animated.View>

        {/* Dotted pattern */}
        <Animated.View style={[dotsAnimatedStyle, { top: '35%' }]} className="absolute">
          <Svg width={300} height={200} viewBox="0 0 300 200">
            {Array.from({ length: 12 }).map((_, row) =>
              Array.from({ length: 20 }).map((_, col) => {
                const x = 15 + col * 14;
                const y = row * 14;
                // Create a semi-circular pattern
                const distanceFromCenter = Math.sqrt(
                  Math.pow(x - 150, 2) + Math.pow(y - 100, 2)
                );
                const opacity = distanceFromCenter < 120 ? 0.3 - (distanceFromCenter / 120) * 0.25 : 0;
                
                if (opacity > 0 && y < 100) {
                  return (
                    <Circle
                      key={`${row}-${col}`}
                      cx={x}
                      cy={y}
                      r="1"
                      fill={isDark ? '#6B7280' : '#9CA3AF'}
                      opacity={opacity}
                    />
                  );
                }
                return null;
              })
            )}
          </Svg>
        </Animated.View>

        {/* Icon */}
        <Animated.View style={cardAnimatedStyle} className="mb-4">
          <Text className="text-6xl">{icon}</Text>
        </Animated.View>

        {/* Notification Card */}
        <Animated.View
          style={cardAnimatedStyle}
          className="w-full bg-card dark:bg-card-dark rounded-3xl p-6 border border-border dark:border-border-dark"
        >
          {/* Header with emoji */}
          <View className="flex-row items-center mb-4">
            <Text className="text-accent dark:text-accent-dark text-lg font-bold mr-2">
              You&apos;re nearby
            </Text>
            <Text className="text-2xl">👀</Text>
          </View>

          {/* Reminder text */}
          <Text className="text-foreground dark:text-foreground-dark text-2xl font-normal mb-8 leading-8">
            {reminderTitle}
          </Text>

          {/* Mark Done Button */}
          <TouchableOpacity
            onPress={handleMarkDone}
            className="bg-accent dark:bg-accent-dark rounded-full py-4 mb-3 items-center"
          >
            <Text
              className="text-accent-foreground dark:text-accent-foreground-dark font-bold text-base tracking-[2px] uppercase"
              style={{ fontFamily: 'Courier' }}
            >
              Mark Done
            </Text>
          </TouchableOpacity>

          {/* Dismiss Button */}
          <TouchableOpacity
            onPress={handleDismiss}
            className="bg-transparent border border-border dark:border-border-dark rounded-full py-4 items-center"
          >
            <Text
              className="text-muted-foreground dark:text-muted-foreground-dark font-bold text-base tracking-[2px] uppercase"
              style={{ fontFamily: 'Courier' }}
            >
              Dismiss
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Location info */}
        <Animated.View style={cardAnimatedStyle} className="mt-6">
          <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs tracking-wider uppercase">
            📍 {locationName} • {distance}
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}