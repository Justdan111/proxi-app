import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendReminderNotification } from '../notifications/notifications';
import { getDistanceMetres, Coordinates } from './distance';
import { Reminder, remindersApi } from '../api/reminders.api';
import { activitiesApi } from '../api/activities.api';

export const GEOFENCE_TASK   = 'PROXI_GEOFENCE_TASK';
export const BG_FETCH_TASK   = 'PROXI_BG_FETCH_TASK';
const REMINDERS_CACHE_KEY    = 'proxi_reminders_cache';
const TRIGGERED_CACHE_KEY    = 'proxi_triggered_cache';
const FENCE_STATE_KEY        = 'proxi_fence_state';

// Leaving a fence requires travelling 15% past its radius. Without this, GPS
// jitter at the boundary reads as a stream of exits and re-entries, and each
// re-entry is a fresh notification.
const EXIT_HYSTERESIS = 1.15;

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

// ─── Geofence occupancy ────────────────────────────────────
// `occupied` is the geometric fact: the user is inside this fence right now.
// `notified` is per-visit: we have already alerted for this stay. They are
// separate because a reminder can be entered outside its active timeframe —
// occupancy starts immediately, but the alert is owed once the window opens.
interface FenceState {
  occupied: string[];
  notified: string[];
}

async function getFenceState(): Promise<{ occupied: Set<string>; notified: Set<string> }> {
  const raw = await AsyncStorage.getItem(FENCE_STATE_KEY);
  if (!raw) return { occupied: new Set(), notified: new Set() };
  try {
    const parsed: FenceState = JSON.parse(raw);
    return {
      occupied: new Set(parsed.occupied ?? []),
      notified: new Set(parsed.notified ?? []),
    };
  } catch {
    return { occupied: new Set(), notified: new Set() };
  }
}

async function setFenceState(occupied: Set<string>, notified: Set<string>) {
  const state: FenceState = { occupied: [...occupied], notified: [...notified] };
  await AsyncStorage.setItem(FENCE_STATE_KEY, JSON.stringify(state));
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

// ─── Server-side completion for `once` reminders ───────────
// The UI promises "triggers once then auto-disables", and the Completed badge
// reads the server's `triggered` field. Local state alone does not survive a
// reinstall and does not sync across devices.
async function completeOnceReminder(reminder: Reminder) {
  try {
    await remindersApi.update(reminder.id, { triggered: true, enabled: false });
  } catch {
    // Fall back to the toggle endpoint so the reminder at least auto-disables.
    try {
      await remindersApi.toggle(reminder.id);
    } catch {
      // Non-critical — the notification has already been delivered.
    }
  }
}

// ─── Core proximity check logic
async function checkProximity(userCoords: Coordinates) {
  const reminders    = await getCachedReminders();
  const triggeredIds = await getTriggeredIds();
  const { occupied, notified } = await getFenceState();

  let stateChanged = false;

  for (const reminder of reminders) {
    const distance   = getDistanceMetres(userCoords, reminder.coordinates);
    const wasInside  = occupied.has(reminder.id);
    // Entering uses the true radius; leaving has to clear the wider ring.
    const threshold  = wasInside ? reminder.radius * EXIT_HYSTERESIS : reminder.radius;
    const inside     = distance <= threshold;

    if (!inside) {
      if (wasInside) {
        occupied.delete(reminder.id);
        notified.delete(reminder.id);
        stateChanged = true;
      }
      continue;
    }

    if (!wasInside) {
      occupied.add(reminder.id);
      stateChanged = true;
    }

    // Already alerted for this visit — this is what stops the once-a-minute spam.
    if (notified.has(reminder.id)) continue;

    // Skip "once" reminders that already fired
    if (reminder.frequency === 'once' && triggeredIds.has(reminder.id)) continue;

    // Outside the active window. Stay occupied but owe the alert, so it fires
    // once the window opens rather than never.
    if (!isInTimeframe(reminder.timeframe)) continue;

    await sendReminderNotification({
      reminderId:    reminder.id,
      reminderTitle: reminder.title,
      location:      reminder.location,
      icon:          reminder.icon,
    });

    notified.add(reminder.id);
    stateChanged = true;

    if (reminder.frequency === 'once') {
      await markTriggered(reminder.id);
      await completeOnceReminder(reminder);
    }

    // Log to the API. Goes through the shared client, so it picks up the JWT
    // from SecureStore and the same base URL as every other request.
    try {
      await activitiesApi.log({
        reminderId:    reminder.id,
        reminderTitle: reminder.title,
        location:      reminder.location,
        icon:          reminder.icon,
        eventType:     'triggered',
      });
    } catch {
      // Non-critical — notification already sent
    }
  }

  if (stateChanged) {
    await setFenceState(occupied, notified);
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

// ─── Start/Stop Tracking
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
