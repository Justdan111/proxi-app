import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { Moon, Sun, Bell, Info, LogOut, ChevronRight, User } from 'lucide-react-native';
import { useTheme } from '@/context/themeContext';
import { useAuth } from '@/context/authContext';

export default function SettingsScreen() {
  const { isDark, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const [notifications, setNotifications] = useState(true);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const profileOpacity = useSharedValue(0);
  const profileScale = useSharedValue(0.9);

  useEffect(() => {
    // Header animation
    headerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });

    // Profile animation
    setTimeout(() => {
      profileOpacity.value = withTiming(1, { duration: 500 });
      profileScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    }, 200);
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const profileAnimatedStyle = useAnimatedStyle(() => ({
    opacity: profileOpacity.value,
    transform: [{ scale: profileScale.value }],
  }));

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.log('[v0] Logout error:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={headerAnimatedStyle} className="px-6 pt-6 pb-4">
          <Text className="text-foreground dark:text-foreground-dark text-4xl font-bold">
            Settings
          </Text>
        </Animated.View>

        <View className="px-6 pb-32">
          {/* Profile Section */}
          <Animated.View style={profileAnimatedStyle} className="mb-8">
            <TouchableOpacity className="bg-card dark:bg-card-dark rounded-3xl p-5 border border-border dark:border-border-dark">
              <View className="flex-row items-center">
                {/* Profile Image */}
                <View className="w-16 h-16 rounded-full bg-accent/20 dark:bg-accent-dark/20 items-center justify-center mr-4">
                  {user && 'photoURL' in user && user.photoURL ? (
                    <Image
                      source={{ uri: (user as any).photoURL }}
                      className="w-16 h-16 rounded-full"
                    />
                  ) : (
                    <User size={32} className="text-accent dark:text-accent-dark" />
                  )}
                </View>

                {/* User Info */}
                <View className="flex-1">
                  <Text className="text-foreground dark:text-foreground-dark font-bold text-lg mb-1">
                    {user?.email?.split('@')[0] || 'User'}
                  </Text>
                  <Text className="text-muted-foreground dark:text-muted-foreground-dark text-sm">
                    {user?.email || 'user@example.com'}
                  </Text>
                </View>

                <ChevronRight size={20} className="text-muted-foreground dark:text-muted-foreground-dark" />
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Appearance Section */}
          <Animated.View entering={FadeInDown.delay(300).springify()} className="mb-8">
            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase tracking-[3px] mb-4">
              Appearance
            </Text>

            <View className="bg-card dark:bg-card-dark rounded-3xl p-5 border border-border dark:border-border-dark">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="bg-accent/20 dark:bg-accent-dark/20 rounded-2xl p-3 mr-4">
                    {isDark ? (
                      <Moon size={20} className="text-accent dark:text-accent-dark" />
                    ) : (
                      <Sun size={20} className="text-accent dark:text-accent-dark" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-foreground dark:text-foreground-dark text-base mb-1">
                      {isDark ? 'Dark Mode' : 'Light Mode'}
                    </Text>
                    <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                      {isDark ? 'Easy on the eyes' : 'Bright and clean'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: '#E5E7EB', true: '#00D4AA' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#E5E7EB"
                />
              </View>
            </View>
          </Animated.View>

          {/* Notifications Section */}
          <Animated.View entering={FadeInDown.delay(400).springify()} className="mb-8">
            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase tracking-[3px] mb-4">
              Notifications
            </Text>

            <View className="bg-card dark:bg-card-dark rounded-3xl p-5 border border-border dark:border-border-dark">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="bg-accent/20 dark:bg-accent-dark/20 rounded-2xl p-3 mr-4">
                    <Bell size={20} className="text-accent dark:text-accent-dark" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-foreground dark:text-foreground-dark text-base mb-1">
                      Location Alerts
                    </Text>
                    <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                      {notifications ? 'Enabled' : 'Disabled'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: '#E5E7EB', true: '#00D4AA' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#E5E7EB"
                />
              </View>
            </View>
          </Animated.View>

          {/* About Section */}
          <Animated.View entering={FadeInDown.delay(500).springify()} className="mb-8">
            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase tracking-[3px] mb-4">
              About
            </Text>

            <View className="bg-card dark:bg-card-dark rounded-3xl p-5 border border-border dark:border-border-dark">
              <View className="flex-row items-start">
                <View className="bg-accent/20 dark:bg-accent-dark/20 rounded-2xl p-3 mr-4">
                  <Info size={20} className="text-accent dark:text-accent-dark" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-foreground dark:text-foreground-dark text-base mb-2">
                    About Proxi
                  </Text>
                  <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark mb-2">
                    Smart reminders, right where you need them.
                  </Text>
                  <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
                    Version 1.0.0
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Logout Button */}
          <Animated.View entering={FadeInDown.delay(600).springify()}>
            <TouchableOpacity
              onPress={handleLogout}
              className="bg-destructive/10 dark:bg-destructive-dark/10 rounded-full py-4 flex-row items-center justify-center border border-destructive/20 dark:border-destructive-dark/20"
            >
              <LogOut size={20} className="text-destructive dark:text-destructive-dark mr-2" />
              <Text className="text-destructive dark:text-destructive-dark font-bold text-base tracking-wider uppercase">
                Log Out
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}