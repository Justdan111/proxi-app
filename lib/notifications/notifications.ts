import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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

  // High-priority channel — alarm style, full screen
  await Notifications.setNotificationChannelAsync('proxi-alarm', {
    name:                     'Proxi Location Alerts',
    description:              'Alarm-style alerts when you arrive at a saved location',
    importance:               Notifications.AndroidImportance.MAX,
    sound:                    'proxi-alert.wav',     // filename only, no path
    vibrationPattern:         [0, 500, 200, 500],   // wait, buzz, pause, buzz
    lightColor:               '#6366f1',
    lockscreenVisibility:     Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd:                true,   // ← breaks through Do Not Disturb
    enableLights:             true,
    enableVibrate:            true,
    showBadge:                true,
  });
}

// ── Request permissions (including Critical Alerts on iOS) ──
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert:         true,
      allowBadge:         true,
      allowSound:         true,
      allowCriticalAlerts: true,  // ← bypasses silent mode on iOS
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
    sound:    'proxi-alert.wav',
    priority: Notifications.AndroidNotificationPriority.MAX,
    data: {
      reminderId: data.reminderId,
      type:       'reminder_trigger',
    },

    // Android specific
    ...(Platform.OS === 'android' && {
      sticky:       false,
      vibrate:      [0, 500, 200, 500],
      color:        '#6366f1',
      categoryIdentifier: 'reminder',
    }),

    // iOS Critical Alert — plays sound even on silent mode
    ...(Platform.OS === 'ios' && {
      interruptionLevel: 'critical',  // iOS 15+ — highest priority
      relevanceScore:    1,
    }),
  };

  await Notifications.scheduleNotificationAsync({
    content: notificationContent,
    trigger: null, // fire immediately
  });
}

// ── Full-screen intent on Android (alarm style) ──────
// This makes the notification take over the screen like an alarm
export async function sendFullScreenReminderNotification(data: ReminderNotificationData) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title:    `${data.icon}  You're nearby!`,
      body:     `Don't forget: ${data.reminderTitle}`,
      sound:    'proxi-alert.wav',
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: {
        reminderId: data.reminderId,
        type:       'reminder_trigger',
        fullScreen: true,
      },
      sticky: true,  // stays until user dismisses
    },
    trigger: null,
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
      sound: 'proxi-alert.wav',
      data:  { reminderId: data.reminderId },
    },
    trigger: {
      seconds: minutes * 60,
      repeats: false,
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