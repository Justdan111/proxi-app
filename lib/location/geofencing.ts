import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendReminderNotification } from '../notifications/notifications';
import { isInsideRadius, Coordinates } from './distance';
import { Reminder } from '../api/reminders.api';

export const GEOFENCE_TASK   = 'PROXI_GEOFENCE_TASK';
export const BG_FETCH_TASK   = 'PROXI_BG_FETCH_TASK';
const REMINDERS_CACHE_KEY    = 'proxi_reminders_cache';
const TRIGGERED_CACHE_KEY    = 'proxi_triggered_cache';

// ─── Cache reminders for background task 
// Background tasks can't use React context — they read from AsyncStorage
export async function cacheRemindersForBackground(reminders: Reminder[]) {
  const enabled = reminders.filter(r => r.enabled);
  await AsyncStorage.setItem(REMINDERS_CACHE_KEY, JSON.stringify(enabled));
}

async function getCachedReminders(): Promise<Reminder[]> {
  const raw = await AsyncStorage.getItem(REMINDERS_CACHE_KEY);
  return raw ? JSON.parse(raw) : [];
}

// Track which "once" reminders already fired (don't re-trigger)
async function getTriggeredIds(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(TRIGGERED_CACHE_KEY);
  return raw ? new Set(JSON.parse(raw)) : new Set();
}

async function markTriggered(id: string) {
  const ids = await getTriggeredIds();
  ids.add(id);
  await AsyncStorage.setItem(TRIGGERED_CACHE_KEY, JSON.stringify([...ids]));
}

// ─── Check current time against reminder timeframe ─────────
function isInTimeframe(timeframe?: { startTime: string; endTime: string }): boolean {
  if (!timeframe) return true; // no timeframe = always active

  const now   = new Date();
  const [startH, startM] = timeframe.startTime.split(':').map(Number);
  const [endH,   endM]   = timeframe.endTime.split(':').map(Number);

  const nowMins   = now.getHours() * 60 + now.getMinutes();
  const startMins = startH * 60 + startM;
  const endMins   = endH   * 60 + endM;

  return nowMins >= startMins && nowMins <= endMins;
}

// ─── Core proximity check logic 
async function checkProximity(userCoords: Coordinates) {
  const reminders   = await getCachedReminders();
  const triggeredIds = await getTriggeredIds();

  for (const reminder of reminders) {
    // Skip "once" reminders that already fired
    if (reminder.frequency === 'once' && triggeredIds.has(reminder.id)) continue;

    // Skip if outside active timeframe
    if (!isInTimeframe(reminder.timeframe)) continue;

    const inside = isInsideRadius(userCoords, reminder.coordinates, reminder.radius);

    if (inside) {
  await sendReminderNotification({
    reminderId:    reminder.id,
    reminderTitle: reminder.title,
    location:      reminder.location,
    icon:          reminder.icon,
  });

      if (reminder.frequency === 'once') {
        await markTriggered(reminder.id);
      }

      // Log to API in background (fire and forget)
      try {
        const token = await AsyncStorage.getItem('proxi_jwt_token');
        if (token) {
          fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/activities`, {
            method:  'POST',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              reminderId:    reminder.id,
              reminderTitle: reminder.title,
              location:      reminder.location,
              icon:          reminder.icon,
              eventType:     'triggered',
            }),
          });
        }
      } catch {
        // Non-critical — notification already sent
      }
    }
  }
}

// ─── Background Location Task 
// Fires every ~100m of movement or every few minutes
TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error('[Geofence Task]', error);
    return;
  }

  const locations: Location.LocationObject[] = data?.locations ?? [];
  if (!locations.length) return;

  const latest = locations[locations.length - 1];
  await checkProximity({
    latitude:  latest.coords.latitude,
    longitude: latest.coords.longitude,
  });
});

// ─── Background Fetch Task 
// Backup check every 15 minutes even without movement
TaskManager.defineTask(BG_FETCH_TASK, async () => {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    await checkProximity({
      latitude:  location.coords.latitude,
      longitude: location.coords.longitude,
    });

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ─── Start/Stop Tracking ─────────────────────────────────────
export async function startGeofencing() {
  // Start background location updates
  const isRegistered = await Location.hasStartedLocationUpdatesAsync(GEOFENCE_TASK)
    .catch(() => false);

  if (!isRegistered) {
    await Location.startLocationUpdatesAsync(GEOFENCE_TASK, {
      accuracy:               Location.Accuracy.Balanced,
      distanceInterval:       50,      // fire every 50m of movement
      timeInterval:           60000,   // or every 60 seconds
      deferredUpdatesInterval: 60000,
      showsBackgroundLocationIndicator: true, // iOS blue bar
      foregroundService: {              // Android foreground service
        notificationTitle:   'Proxi is active',
        notificationBody:    'Watching for nearby reminders',
        notificationColor:   '#6366f1',
      },
    });
  }

  // Register backup background fetch
  await BackgroundFetch.registerTaskAsync(BG_FETCH_TASK, {
    minimumInterval:        15 * 60, // 15 minutes
    stopOnTerminate:        false,
    startOnBoot:            true,
  });
}

export async function stopGeofencing() {
  const isRunning = await Location.hasStartedLocationUpdatesAsync(GEOFENCE_TASK)
    .catch(() => false);

  if (isRunning) {
    await Location.stopLocationUpdatesAsync(GEOFENCE_TASK);
  }

  await BackgroundFetch.unregisterTaskAsync(BG_FETCH_TASK).catch(() => {});
}