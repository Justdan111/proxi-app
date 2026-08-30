import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Image,
  Alert,
  AppState,
  Linking,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { Moon, Sun, Bell, Info, LogOut, ChevronRight, User, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/context/themeContext';
import { useAuth } from '@/context/authContext';
import { checkPermissions, requestNotificationPermission } from '@/lib/location/permissions';

export default function SettingsScreen() {
  const { isDark, toggleTheme } = useTheme();
  const { logout, deleteAccount, user } = useAuth();
  // Mirrors the real OS permission rather than a local boolean that did nothing.
  const [notifications, setNotifications] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  // Re-check on foreground: the user may have changed it in system settings.
  useEffect(() => {
    let mounted = true;

    const sync = () => {
      checkPermissions()
        .then((status) => {
          if (mounted) setNotifications(status.notifications);
        })
        .catch(() => {});
    };

    sync();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });

    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const handleNotificationToggle = async (next: boolean) => {
    if (next) {
      const granted = await requestNotificationPermission();
      setNotifications(granted);
      if (!granted) {
        // Already denied once — the OS will not prompt again.
        Alert.alert(
          'Notifications Are Off',
          'Proxi cannot alert you at a saved location without notification permission. Enable it in Settings.',
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
      return;
    }

    // The OS owns this permission; an app cannot revoke its own.
    Alert.alert(
      'Turn Off Notifications',
      'Notification permission is controlled by your device settings. Proxi cannot turn it off for you.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This permanently deletes your account, every reminder you have saved, and your activity history. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const ok = await deleteAccount();
            setDeleting(false);
            if (!ok) {
              Alert.alert(
                'Could Not Delete Account',
                'Your account was not deleted. Please check your connection and try again.'
              );
            }
          },
        },
      ]
    );
  };

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const profileAnimatedStyle = useAnimatedStyle(() => ({
    opacity: profileOpacity.value,
    transform: [{ scale: profileScale.value }],
  }));

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.log('[v0] Logout error:', error);
            }
          },
        },
      ]
    );
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
            <View className="bg-card dark:bg-card-dark rounded-3xl p-5 border border-border dark:border-border-dark">
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

              </View>
            </View>
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
                      {notifications ? 'Enabled' : 'Disabled in system settings'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={notifications}
                  onValueChange={(next) => { void handleNotificationToggle(next); }}
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
              className="bg-card dark:bg-card-dark rounded-3xl p-5 border border-border dark:border-border-dark"
            >
              <View className="flex-row items-center">
                <View className="bg-destructive/10 dark:bg-destructive-dark/10 rounded-2xl p-3 mr-4">
                  <LogOut size={20} className="text-destructive dark:text-destructive-dark" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-destructive dark:text-destructive-dark text-base mb-1">
                    Log Out
                  </Text>
                  <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                    Sign out of your account
                  </Text>
                </View>
                <ChevronRight size={20} className="text-muted-foreground dark:text-muted-foreground-dark" />
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Delete Account */}
          <Animated.View entering={FadeInDown.delay(700).springify()} className="mt-4">
            <TouchableOpacity
              onPress={handleDeleteAccount}
              disabled={deleting}
              className="bg-destructive/10 dark:bg-destructive-dark/10 rounded-3xl p-5 border border-destructive/20 dark:border-destructive-dark/20"
            >
              <View className="flex-row items-center">
                <View className="bg-destructive/10 dark:bg-destructive-dark/10 rounded-2xl p-3 mr-4">
                  <Trash2 size={20} className="text-destructive dark:text-destructive-dark" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-destructive dark:text-destructive-dark text-base mb-1">
                    {deleting ? 'Deleting Account...' : 'Delete Account'}
                  </Text>
                  <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                    Permanently removes your account and all its data
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}