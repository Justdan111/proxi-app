import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ACCENT } from '../theme';

// ── Android channel ──────────────────────────────────
// An Android channel's importance, sound, and vibration are frozen at creation.
// Changing any of them requires a NEW id — existing installs keep the old settings
// forever. Bump this constant (and the defaultChannel in app.json) when that happens.
export const ALARM_CHANNEL_ID = 'proxi-alarm-v2';
const LEGACY_ALARM_CHANNEL_ID = 'proxi-alarm';

// ── Foreground behavior — show even when app is open ──
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:  true,
    shouldPlaySound:  true,
    shouldSetBadge:   true,
    shouldShowBanner: true,
    shouldShowList:   true,
    priority:         Notifications.AndroidNotificationPriority.MAX,
  }),
});

// ── Android channels ─────────────────────────────────
export async function setupNotificationChannel() {
  if (Platform.OS !== 'android') return;

  // High-priority channel — alarm style
  await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
    name:                     'Proxi Location Alerts',
    description:              'Alarm-style alerts when you arrive at a saved location',
    importance:               Notifications.AndroidImportance.MAX,
    sound:                    'proxi_alert.wav',     // filename only, no path
    vibrationPattern:         [0, 500, 200, 500],   // wait, buzz, pause, buzz
    lightColor:               ACCENT,
    lockscreenVisibility:     Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd:                true,   // ← breaks through Do Not Disturb
    enableLights:             true,
    enableVibrate:            true,
    showBadge:                true,
  });

  // Drop the superseded channel so it stops appearing in Android's settings screen.
  await Notifications.deleteNotificationChannelAsync(LEGACY_ALARM_CHANNEL_ID).catch(() => {});
}

// ── Request permissions ──────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert:         true,
      allowBadge:         true,
      allowSound:         true,
      provideAppNotificationSettings: true,
    },
  });

  return status === 'granted';
}

// ── Main notification sender ─────────────────────────
export interface ReminderNotificationData {
  reminderId:    string;
  reminderTitle: string;
  location:      string;
  icon:          string;
}

export async function sendReminderNotification(data: ReminderNotificationData) {
  const notificationContent: Notifications.NotificationContentInput = {
    title:    `${data.icon}  You're nearby!`,
    body:     `Don't forget: ${data.reminderTitle} · ${data.location}`,
    sound:    'proxi_alert.wav',
    priority: Notifications.AndroidNotificationPriority.MAX,
    // Both platforms — this is what renders the Done and Snooze buttons.
    categoryIdentifier: 'reminder',
    data: {
      reminderId:    data.reminderId,
      reminderTitle: data.reminderTitle,
      location:      data.location,
      icon:          data.icon,
      type:          'reminder_trigger',
    },

    // Android specific
    ...(Platform.OS === 'android' && {
      sticky:  false,
      vibrate: [0, 500, 200, 500],
      color:   ACCENT,
    }),

    // iOS — timeSensitive breaks through Focus modes and needs no entitlement.
    // 'critical' requires an Apple-granted entitlement the app does not have.
    ...(Platform.OS === 'ios' && {
      interruptionLevel: 'timeSensitive' as const,
      relevanceScore:    1,
    }),
  };

  await Notifications.scheduleNotificationAsync({
    content: notificationContent,
    // channelId belongs on the TRIGGER. Setting it on the content silently does
    // nothing and the notification falls back to the default channel.
    trigger: Platform.OS === 'android' ? { channelId: ALARM_CHANNEL_ID } : null,
  });
}

// ── Notification action buttons ──────────────────────
// "Done" and "Snooze" buttons on the notification
export async function registerNotificationCategories() {
  await Notifications.setNotificationCategoryAsync('reminder', [
    {
      identifier: 'done',
      buttonTitle: '✅ Done',
      options: {
        isDestructive:  false,
        isAuthenticationRequired: false,
      },
    },
    {
      identifier: 'snooze',
      buttonTitle: '⏰ Remind again in 10min',
      options: {
        isDestructive:  false,
        isAuthenticationRequired: false,
      },
    },
  ]);
}

// ── Snooze a reminder ────────────────────────────────
export async function snoozeReminder(data: ReminderNotificationData, minutes = 10) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${data.icon}  Snoozed Reminder`,
      body:  `Don't forget: ${data.reminderTitle}`,
      sound: 'proxi_alert.wav',
      categoryIdentifier: 'reminder',
      data: {
        reminderId:    data.reminderId,
        reminderTitle: data.reminderTitle,
        location:      data.location,
        icon:          data.icon,
        type:          'reminder_trigger',
      },
      ...(Platform.OS === 'ios' && {
        interruptionLevel: 'timeSensitive' as const,
        relevanceScore:    1,
      }),
    },
    trigger: {
      type:      Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds:   minutes * 60,
      repeats:   false,
      channelId: ALARM_CHANNEL_ID,
    },
  });
}

// ── Listener for button taps on notification ─────────
export function addNotificationResponseListener(
  onOpen:   (reminderId: string) => void,
  onDone?:  (reminderId: string) => void,
  onSnooze?: (reminderId: string, data: ReminderNotificationData) => void,
) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const { reminderId, reminderTitle, location, icon } =
      response.notification.request.content.data as any;

    const action = response.actionIdentifier;

    if (action === 'done' && onDone) {
      onDone(reminderId);
    } else if (action === 'snooze' && onSnooze) {
      onSnooze(reminderId, { reminderId, reminderTitle, location, icon });
    } else {
      // Default — user tapped the notification body
      onOpen(reminderId);
    }
  });
}
