
import '../global.css';

import React, { useEffect, useState } from 'react';
import { Redirect, Stack, useSegments } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'react-native';
import { ThemeProvider } from '@/context/themeContext';
import { AuthProvider, useAuth } from '@/context/authContext';
import { ReminderProvider } from '@/context/reminderContext';
import SplashScreen from '@/components/splashScreen';



ExpoSplashScreen.preventAutoHideAsync();

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
            <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
            <RootNavigator />
          </ReminderProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
