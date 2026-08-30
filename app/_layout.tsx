
import '../global.css';

import React, { useEffect, useRef, useState } from 'react';
import { Redirect, Stack, router, useSegments } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'react-native';
import { ThemeProvider } from '@/context/themeContext';
import { AuthProvider, useAuth } from '@/context/authContext';
import { ReminderProvider, useReminders } from '@/context/reminderContext';
import SplashScreen from '@/components/splashScreen';
import {
  setupNotificationChannel,
  registerNotificationCategories,
  addNotificationResponseListener,
  snoozeReminder,
} from '@/lib/notifications/notifications';
import { startGeofencing, stopGeofencing, cacheRemindersForBackground } from '@/lib/location/geofencing';
import { requestAllPermissions } from '@/lib/location/permissions';



ExpoSplashScreen.preventAutoHideAsync();

function AppInitializer() {
  const { isAuthenticated } = useAuth();
  const { reminders } = useReminders();
  const listenerRef = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    void setupNotificationChannel();
    void registerNotificationCategories();

    listenerRef.current = addNotificationResponseListener(
      (reminderId) => {
        if (reminderId) {
          router.push('/(tab)/home');
        }
      },
      (reminderId) => {
        console.log('Marked done:', reminderId);
      },
      (reminderId, data) => {
        if (reminderId) {
          void snoozeReminder(data, 10);
        }
      }
    );

    return () => {
      listenerRef.current?.remove();
      listenerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      void stopGeofencing();
      return;
    }

    const initGeofencing = async () => {
      const perms = await requestAllPermissions();
      if (perms.backgroundLocation) {
        await startGeofencing();
      }
    };

    void initGeofencing();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void cacheRemindersForBackground(reminders);
  }, [isAuthenticated, reminders]);

  return null;
}

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const inAuthGroup = segments[0] === '(auth)';

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!isAuthenticated && !inAuthGroup) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isAuthenticated && inAuthGroup) {
    return <Redirect href="/(tab)/home" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}


export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await ExpoSplashScreen.hideAsync();
        setAppReady(true);
      } catch (error) {
        console.log(' SplashScreen error:', error);
      }
    }
    prepare();
  }, []);

  if (!appReady) {
    return null;
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <ThemeProvider>
        <AuthProvider>
          <ReminderProvider>
            <AppInitializer />
            <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
            <RootNavigator />
          </ReminderProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
