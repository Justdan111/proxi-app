
import '../global.css';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Redirect, Stack, router, useSegments } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppState, StatusBar } from 'react-native';
import { ThemeProvider } from '@/context/themeContext';
import { AuthProvider, useAuth } from '@/context/authContext';
import { ReminderProvider, useReminders } from '@/context/reminderContext';
import { LocationDraftProvider } from '@/context/locationDraftContext';
import SplashScreen from '@/components/splashScreen';
import {
  setupNotificationChannel,
  registerNotificationCategories,
  addNotificationResponseListener,
  snoozeReminder,
} from '@/lib/notifications/notifications';
import { startGeofencing, stopGeofencing, cacheRemindersForBackground } from '@/lib/location/geofencing';
import { checkPermissions } from '@/lib/location/permissions';
import { haptics } from '@/lib/haptics';



ExpoSplashScreen.preventAutoHideAsync();

function AppInitializer() {
  const { isAuthenticated } = useAuth();
  const { reminders, updateReminder, fetchReminders } = useReminders();
  const listenerRef = useRef<Notifications.EventSubscription | null>(null);
  const receivedRef = useRef<Notifications.EventSubscription | null>(null);

  // The notification listeners are registered once, so they would otherwise
  // close over the reminders array as it was on first render. Mirrored in an
  // effect rather than during render, which is not a legal place to touch a ref.
  const remindersRef = useRef(reminders);
  useEffect(() => {
    remindersRef.current = reminders;
  }, [reminders]);

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
        if (!reminderId) return;
        const reminder = remindersRef.current.find(r => r.id === reminderId);
        if (!reminder) return;

        // A `once` reminder is finished, so it also auto-disables — which is
        // what the add-reminder screen promises. An `always` reminder stays on.
        void updateReminder(
          reminderId,
          reminder.frequency === 'once'
            ? { triggered: true, enabled: false }
            : { triggered: true }
        );
      },
      (reminderId, data) => {
        if (reminderId) {
          void snoozeReminder(data, 10);
        }
      }
    );

    // A geofence firing while the app is open is the one case where a haptic
    // can reach the user; the background task cannot fire one.
    receivedRef.current = Notifications.addNotificationReceivedListener((notification) => {
      const { type } = notification.request.content.data as { type?: string };
      if (type === 'reminder_trigger') {
        haptics.warning();
      }
    });

    return () => {
      listenerRef.current?.remove();
      listenerRef.current = null;
      receivedRef.current?.remove();
      receivedRef.current = null;
    };
  }, [updateReminder]);

  // Reads the current permission answer and matches geofencing to it. Never
  // prompts: asking for Always location before the user has created a reminder
  // gives them nothing to say yes to, which is what Apple guideline 5.1.5
  // objects to. The prompt happens when the first reminder is saved.
  const syncGeofencing = useCallback(async () => {
    const perms = await checkPermissions();
    if (perms.backgroundLocation) {
      await startGeofencing();
    } else {
      // Covers revocation too — permission taken away in system settings while
      // the app was running would otherwise leave the task registered.
      await stopGeofencing();
    }
  }, []);

  // `once` completion is written by the background task, which cannot touch
  // React state. Re-read on foreground so the Completed badge is not stale.
  //
  // Geofencing is re-checked here for a different reason: the permission answer
  // can change outside the app entirely. Someone who declines at first save and
  // later enables "Always" in system settings would otherwise get no geofencing
  // at all until the app was restarted — the core feature silently dead for
  // precisely the user who just went and turned it on.
  useEffect(() => {
    if (!isAuthenticated) return;

    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void fetchReminders();
      void syncGeofencing();
    });

    return () => sub.remove();
  }, [isAuthenticated, fetchReminders, syncGeofencing]);

  useEffect(() => {
    if (!isAuthenticated) {
      void stopGeofencing();
      return;
    }

    void syncGeofencing();
  }, [isAuthenticated, syncGeofencing]);

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
            <LocationDraftProvider>
              <AppInitializer />
              <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
              <RootNavigator />
            </LocationDraftProvider>
          </ReminderProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
