import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// How notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('proxi-reminders', {
      name:             'Proxi Reminders',
      importance:       Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:       '#6366f1',
      sound:            'default',
    });
  }
}

export interface ReminderNotificationData {
  reminderId:    string;
  reminderTitle: string;
  location:      string;
  icon:          string;
}

// Fire a local notification when geofence triggers
export async function sendReminderNotification(data: ReminderNotificationData) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${data.icon}  You're nearby!`,
      body:  `Don't forget: ${data.reminderTitle}`,
      data:  { reminderId: data.reminderId },
      sound: 'default',
    },
    trigger: null, // null = fire immediately
  });
}

// Listen for notification taps (navigate to reminder)
export function addNotificationResponseListener(
  callback: (reminderId: string) => void
) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const reminderId = response.notification.request.content.data?.reminderId;
    if (reminderId) callback(reminderId as string);
  });
}