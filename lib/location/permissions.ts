import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Alert, Linking } from 'react-native';

export interface PermissionStatus {
  foregroundLocation: boolean;
  backgroundLocation: boolean;
  notifications: boolean;
}

// Request foreground location (required before background)
export async function requestForegroundLocation(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

// Request background location (iOS/Android both need this for geofencing)
export async function requestBackgroundLocation(): Promise<boolean> {
  const foreground = await requestForegroundLocation();
  if (!foreground) return false;

  const { status } = await Location.requestBackgroundPermissionsAsync();
  return status === 'granted';
}

// Request push notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Request all permissions at once — call on first app launch
export async function requestAllPermissions(): Promise<PermissionStatus> {
  const foregroundLocation  = await requestForegroundLocation();
  const backgroundLocation  = await requestBackgroundLocation();
  const notifications       = await requestNotificationPermission();

  return { foregroundLocation, backgroundLocation, notifications };
}

// Check current status without prompting
export async function checkPermissions(): Promise<PermissionStatus> {
  const fg   = await Location.getForegroundPermissionsAsync();
  const bg   = await Location.getBackgroundPermissionsAsync();
  const notif = await Notifications.getPermissionsAsync();

  return {
    foregroundLocation: fg.status === 'granted',
    backgroundLocation: bg.status === 'granted',
    notifications:      notif.status === 'granted',
  };
}

// Guide user to Settings if they denied permission
export function showPermissionAlert(type: 'location' | 'notifications') {
  const messages = {
    location: {
      title: 'Location Permission Required',
      body:  'Proxi needs "Always" location access to notify you near saved places. Tap Settings to enable it.',
    },
    notifications: {
      title: 'Notifications Required',
      body:  'Enable notifications so Proxi can alert you when you arrive at a saved location.',
    },
  };

  const { title, body } = messages[type];
  Alert.alert(title, body, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Open Settings', onPress: () => Linking.openSettings() },
  ]);
}