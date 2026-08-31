import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing,  SlideInUp, FadeInDown, } from 'react-native-reanimated';
import { X, Check, Clock, Repeat, Repeat1, MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/themeContext';
import { useReminders } from '@/context/reminderContext';
import ReminderMap from '@/components/maps/ReminderMap';
import { haptics } from '@/lib/haptics';
import { useLocationDraft } from '@/context/locationDraftContext';
import { checkPermissions, requestBackgroundLocation, requestNotificationPermission } from '@/lib/location/permissions';
import { startGeofencing } from '@/lib/location/geofencing';
import { ACCENT } from '@/lib/theme';

// The reminder icon had no way to be set, so every reminder saved as the
// default pin. These are the choices offered for it.
const REMINDER_ICONS = ['📍', '🏠', '🏢', '🛒', '💊', '🏋️', '☕', '🎓', '🚗', '✈️'];

const TIME_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

type AddReminderScreenProps = {
  onBack?: () => void;
};

function parseTimeToMinutes(value: string): number | null {
  const trimmed = value.trim();
  const match = trimmed.match(TIME_24H_REGEX);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * 60 + minutes;
}

export default function AddReminderScreen({ onBack }: AddReminderScreenProps) {
  const [title, setTitle] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationIcon, setLocationIcon] = useState('📍');
  const [radius, setRadius] = useState(300);
  const [frequency, setFrequency] = useState<'once' | 'always'>('once');
  const [useTimeframe, setUseTimeframe] = useState(false);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('20:00');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const router = useRouter();
  const { isDark } = useTheme();
  const { createReminder, error: reminderError } = useReminders();
  const { draft, clearDraft } = useLocationDraft();

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.95);

  // Handle selected location from location-picker. Consumed once, so
  // re-entering the screen does not resurrect a stale choice.
  useEffect(() => {
    if (!draft) return;
    setLocationName(draft.name);
    setLocationAddress(draft.address);
    setLocationCoords(draft.coordinates);
    clearDraft();
  }, [draft, clearDraft]);

  useEffect(() => {
    // Staggered entrance animations
    headerOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });

    setTimeout(() => {
      buttonOpacity.value = withTiming(1, { duration: 500 });
      buttonScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    }, 400);
  }, [buttonOpacity, buttonScale, headerOpacity, headerTranslateY]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  const radiusOptions = [100, 300, 500];

  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  const timeframeFormatInvalid = useTimeframe && (startMinutes === null || endMinutes === null);
  const timeframeRangeInvalid =
    useTimeframe &&
    startMinutes !== null &&
    endMinutes !== null &&
    startMinutes >= endMinutes;
  const timeframeError = timeframeFormatInvalid
    ? 'Use 24-hour format HH:MM (e.g. 08:00, 17:30).'
    : timeframeRangeInvalid
      ? 'Start time must be earlier than end time.'
      : null;
  const canSave =
    !!title.trim() &&
    !!locationCoords &&
    !!locationName.trim() &&
    !!locationAddress.trim() &&
    !saving &&
    !timeframeError;

  // Contextual permission prompt (audit 4.7). Never blocks the save.
  const ensureRemindersCanFire = async () => {
    try {
      const status = await checkPermissions();

      if (!status.notifications) {
        await requestNotificationPermission();
      }

      if (!status.backgroundLocation) {
        const granted = await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Let Proxi Watch For This Place',
            'To alert you when you arrive, Proxi needs location access set to "Always". It only checks your location against the reminders you have saved.',
            [
              { text: 'Not Now', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Continue', onPress: () => resolve(true) },
            ],
            { cancelable: false }
          );
        });

        if (granted && (await requestBackgroundLocation())) {
          await startGeofencing();
        }
        return;
      }

      await startGeofencing();
    } catch {
      // The reminder is saved either way; it simply will not fire until the
      // permission is granted from Settings.
    }
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    const trimmedLocationName = locationName.trim();
    const trimmedLocationAddress = locationAddress.trim();

    if (!trimmedTitle || !locationCoords || !trimmedLocationName || !trimmedLocationAddress) {
      haptics.error();
      setSaveError('Please add a title and select a valid location before saving.');
      return;
    }

    if (timeframeError) {
      haptics.error();
      setSaveError(timeframeError);
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const created = await createReminder({
        title: trimmedTitle,
        location: trimmedLocationName,
        address: trimmedLocationAddress,
        radius,
        icon: locationIcon,
        frequency,
        timeframe: useTimeframe ? { startTime, endTime } : undefined,
        coordinates: locationCoords,
      });

      if (!created) {
        setSaveError(reminderError || 'Unable to save reminder. Please try again.');
        return;
      }

      // Ask for what the reminder actually needs, now that the user has made
      // one and the reason is obvious. Declining still saves the reminder.
      await ensureRemindersCanFire();

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        router.replace('/(tab)/home');
      }, 900);
    } finally {
      setSaving(false);
    }
  };



  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          {/* Header */}
          <Animated.View style={headerAnimatedStyle} className="flex-row items-center justify-between mb-8">
            <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
              <X size={24} color={isDark ? ACCENT : '#1a1a1a'} />
            </TouchableOpacity>
            <Text 
              className="text-foreground dark:text-foreground-dark text-lg font-bold tracking-[3px] uppercase"
            >
              New Reminder
            </Text>
            <View className="w-10" />
          </Animated.View>

          {/* Reminder Title */}
          <Animated.View entering={FadeInDown.delay(100).springify()} className="mb-6">
            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase mb-3 tracking-[2px]">
              What&apos;s the plan?
            </Text>
            <TextInput
              placeholder="Remind me to..."
              placeholderTextColor="#6B7280"
              value={title}
              onChangeText={setTitle}
              className="w-full bg-card dark:bg-card-dark px-5 py-4 text-xl text-foreground dark:text-foreground-dark rounded-2xl"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </Animated.View>

          {/* Location */}
          {/* Icon */}
          <Animated.View entering={FadeInDown.delay(150).springify()} className="mb-6">
            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase tracking-[2px] mb-3">
              Icon
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {REMINDER_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    onPress={() => { haptics.toggle(); setLocationIcon(icon); }}
                    className={`w-14 h-14 rounded-2xl items-center justify-center border ${
                      locationIcon === icon
                        ? 'bg-accent/20 dark:bg-accent-dark/20 border-accent dark:border-accent-dark'
                        : 'bg-card dark:bg-card-dark border-border dark:border-border-dark'
                    }`}
                  >
                    <Text className="text-2xl">{icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()} className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase tracking-[2px]">
                Location
              </Text>
              <TouchableOpacity onPress={() => router.push('/location-picker')}>
                <Text className="text-accent dark:text-accent-dark text-sm font-bold">
                  Change
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              onPress={() => router.push('/location-picker')}
              className="flex-row items-center bg-card dark:bg-card-dark px-5 py-4 rounded-2xl"
            >
              <View className="bg-accent/20 dark:bg-accent-dark/20 rounded-full p-3 mr-4 items-center justify-center">
                <Text className="text-2xl">{locationIcon}</Text>
              </View>
              <View className="flex-1">
                <Text className="font-bold text-foreground dark:text-foreground-dark text-base mb-1">
                  {locationName || 'Select a location'}
                </Text>
                <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                  {locationAddress || 'Tap to choose'}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Repeat Options */}
          <Animated.View entering={FadeInDown.delay(300).springify()} className="mb-6">
            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase mb-3 tracking-[2px]">
              Repeat
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setFrequency('once')}
                className={`flex-1 flex-row items-center justify-center rounded-2xl py-4 ${
                  frequency === 'once' 
                    ? 'bg-accent dark:bg-accent-dark' 
                    : 'bg-card dark:bg-card-dark border border-border dark:border-border-dark'
                }`}
              >
                <Repeat1 
                  size={20} 
                  color={frequency === 'once' ? (isDark ? '#1a1a1a' : '#ffffff') : (isDark ? '#9CA3AF' : '#6B7280')}
                  style={{ marginRight: 8 }}
                />
                <Text
                  className={`font-bold text-base ${
                    frequency === 'once' 
                      ? 'text-accent-foreground dark:text-accent-foreground-dark' 
                      : 'text-muted-foreground dark:text-muted-foreground-dark'
                  }`}
                >
                  Once
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setFrequency('always')}
                className={`flex-1 flex-row items-center justify-center rounded-2xl py-4 ${
                  frequency === 'always' 
                    ? 'bg-accent dark:bg-accent-dark' 
                    : 'bg-card dark:bg-card-dark border border-border dark:border-border-dark'
                }`}
              >
                <Repeat 
                  size={20} 
                  color={frequency === 'always' ? (isDark ? '#1a1a1a' : '#ffffff') : (isDark ? '#9CA3AF' : '#6B7280')}
                  style={{ marginRight: 8 }}
                />
                <Text
                  className={`font-bold text-base ${
                    frequency === 'always' 
                      ? 'text-accent-foreground dark:text-accent-foreground-dark' 
                      : 'text-muted-foreground dark:text-muted-foreground-dark'
                  }`}
                >
                  Always
                </Text>
              </TouchableOpacity>
            </View>
            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs mt-2 text-center">
              {frequency === 'once' ? 'Triggers once then auto-disables' : 'Triggers every time you enter the area'}
            </Text>
          </Animated.View>

          {/* Timeframe */}
          <Animated.View entering={FadeInDown.delay(400).springify()} className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase tracking-[2px]">
                Time Frame
              </Text>
              <TouchableOpacity
                onPress={() => setUseTimeframe(!useTimeframe)}
                className={`w-14 h-8 rounded-full p-1 ${
                  useTimeframe 
                    ? 'bg-accent dark:bg-accent-dark' 
                    : 'bg-muted dark:bg-muted-dark'
                }`}
              >
                <Animated.View
                  className="w-6 h-6 rounded-full bg-foreground dark:bg-foreground-dark"
                  style={{
                    transform: [{ translateX: useTimeframe ? 24 : 0 }],
                  }}
                />
              </TouchableOpacity>
            </View>
            
            {useTimeframe && (
              <View className="bg-card dark:bg-card-dark rounded-2xl p-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 items-center">
                    <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs mb-2">FROM</Text>
                    <View className="flex-row items-center bg-background dark:bg-background-dark rounded-xl px-4 py-3">
                      <Clock size={16} color={ACCENT} style={{ marginRight: 8 }} />
                      <TextInput
                        value={startTime}
                        onChangeText={setStartTime}
                        placeholder="08:00"
                        placeholderTextColor="#6B7280"
                        className="text-foreground dark:text-foreground-dark text-lg font-bold w-16 text-center"
                      />
                    </View>
                  </View>
                  <Text className="text-muted-foreground dark:text-muted-foreground-dark mx-4">—</Text>
                  <View className="flex-1 items-center">
                    <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs mb-2">TO</Text>
                    <View className="flex-row items-center bg-background dark:bg-background-dark rounded-xl px-4 py-3">
                      <Clock size={16} color={ACCENT} style={{ marginRight: 8 }} />
                      <TextInput
                        value={endTime}
                        onChangeText={setEndTime}
                        placeholder="20:00"
                        placeholderTextColor="#6B7280"
                        className="text-foreground dark:text-foreground-dark text-lg font-bold w-16 text-center"
                      />
                    </View>
                  </View>
                </View>
                {timeframeError ? (
                  <Text className="text-rose-500 text-xs mt-3 text-center">{timeframeError}</Text>
                ) : null}
                <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs mt-3 text-center">
                  Only trigger notifications during this time
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Proximity Radius */}
          <Animated.View entering={FadeInDown.delay(500).springify()} className="mb-6">
            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase mb-3 tracking-[2px]">
              Proximity Radius
            </Text>

            {/* Radius Buttons */}
            <View className="flex-row gap-3 mb-4">
              {radiusOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => setRadius(option)}
                  className={`flex-1 rounded-2xl py-4 items-center ${
                    radius === option 
                      ? 'bg-accent dark:bg-accent-dark' 
                      : 'bg-card dark:bg-card-dark border border-border dark:border-border-dark'
                  }`}
                >
                  <Text
                    className={`font-bold text-base ${
                      radius === option 
                        ? 'text-accent-foreground dark:text-accent-foreground-dark' 
                        : 'text-muted-foreground dark:text-muted-foreground-dark'
                    }`}
                  >
                    {option}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Map Visualization with Location */}
            <View className="rounded-2xl overflow-hidden" style={{ height: 220 }}>
                {locationCoords ? (
                  <ReminderMap
                    center={locationCoords}
                    radius={radius}
                    height={220}
                    // No onLocationSelect here — read-only preview
                  />
                ) : (
                  <View className="h-full bg-card dark:bg-card-dark rounded-2xl items-center justify-center">
                    <MapPin size={28} color="#6B7280" />
                    <Text className="text-muted-foreground dark:text-muted-foreground-dark text-sm mt-3">
                      Select a location to preview
                    </Text>
                  </View>
                )}

                {/* Radius badge overlay */}
                {locationCoords && (
                  <View
                    className="absolute top-3 left-3 bg-accent/90 dark:bg-accent-dark/90 px-3 py-1 rounded-full"
                  >
                    <Text className="text-accent-foreground dark:text-accent-foreground-dark text-xs font-bold">
                      {radius}m radius
                    </Text>
                  </View>
                )}
              </View>

          </Animated.View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <Animated.View style={buttonAnimatedStyle} className="px-6 pb-8">
        {saveError ? (
          <View className="mb-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3">
            <Text className="text-rose-500 text-sm">{saveError}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave}
          className={`rounded-full py-5 items-center flex-row justify-center ${
            !canSave
              ? 'bg-muted dark:bg-muted-dark' 
              : 'bg-accent dark:bg-accent-dark'
          }`}
        >
          <Check 
            size={24} 
            color={!canSave ? '#6B7280' : (isDark ? '#1a1a1a' : '#ffffff')}
            style={{ marginRight: 8 }}
          />
          <Text
            className={`font-bold text-lg ${
              !canSave
                ? 'text-muted-foreground dark:text-muted-foreground-dark' 
                : 'text-accent-foreground dark:text-accent-foreground-dark'
            }`}
          >
            {saving ? 'Saving...' : 'Save Reminder'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Success Modal */}
      <Modal transparent visible={saved} animationType="fade">
        <View className="flex-1 bg-background/80 dark:bg-background-dark/80 items-center justify-center">
          <Animated.View 
            entering={SlideInUp.springify()} 
            className="bg-accent dark:bg-accent-dark rounded-3xl px-8 py-5 items-center mx-6"
          >
            <View className="flex-row items-center">
              <Check size={24} color={isDark ? '#1a1a1a' : '#ffffff'} style={{ marginRight: 8 }} />
              <Text className="text-accent-foreground dark:text-accent-foreground-dark font-bold text-xl">
                Reminder Saved!
              </Text>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}