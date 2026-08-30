import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Haptics require the app to be foregrounded. They cannot fire from the
// background geofence task — there, the notification's vibration pattern is the
// only tactile channel. Everything routes through here so it can be muted.
let enabled = true;

export function setHapticsEnabled(next: boolean) {
  enabled = next;
}

export function areHapticsEnabled() {
  return enabled;
}

function fire(run: () => Promise<void>) {
  if (!enabled || Platform.OS === 'web') return;
  // Never let feedback break the interaction that triggered it.
  void run().catch(() => {});
}

export const haptics = {
  /** Toggling a reminder on or off. */
  toggle:  () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** A save or other action succeeded. */
  success: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** A save failed, or validation rejected the input. */
  error:   () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  /** Destructive action — deleting a reminder. */
  remove:  () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  /** Discrete selection, such as confirming a location. */
  select:  () => fire(() => Haptics.selectionAsync()),
  /** A geofence fired while the app was open. */
  warning: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
