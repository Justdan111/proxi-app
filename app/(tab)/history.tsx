import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { History as HistoryIcon, MapPin, RotateCcw } from 'lucide-react-native';
import { useReminders } from '@/context/reminderContext';
import type { Reminder } from '@/lib/api';
import { haptics } from '@/lib/haptics';
import { ACCENT } from '@/lib/theme';

// A reminder is "past" once it has stopped watching for you: a `once` reminder
// that fired (the background task writes `triggered`), or any reminder switched
// off. Both are finished work the user might want again, which is the whole
// point of this screen — nothing here is deleted, so every detail survives.
function isPast(reminder: Reminder) {
  return reminder.triggered || !reminder.enabled;
}

function completedLabel(reminder: Reminder) {
  const when = new Date(reminder.updatedAt);
  if (Number.isNaN(when.getTime())) return null;

  const days = Math.floor((Date.now() - when.getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return when.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

type CardProps = {
  item: Reminder;
  index: number;
  busy: boolean;
  onSetUpAgain: (reminder: Reminder) => void;
};

function PastReminderCard({ item, index, busy, onSetUpAgain }: CardProps) {
  const completed = completedLabel(item);

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()} className="mb-3">
      <View className="bg-card dark:bg-card-dark rounded-3xl p-5 border border-border dark:border-border-dark">
        <View className="flex-row items-start">
          <View className="bg-muted/60 dark:bg-muted-dark/60 rounded-2xl p-3 mr-3">
            <Text className="text-3xl">{item.icon}</Text>
          </View>

          <View className="flex-1 pt-1">
            <Text className="text-foreground dark:text-foreground-dark font-bold text-lg mb-1">
              {item.title}
            </Text>
            <View className="flex-row items-center">
              <MapPin size={13} color={ACCENT} />
              <Text
                className="text-muted-foreground dark:text-muted-foreground-dark text-sm ml-1 flex-1"
                numberOfLines={1}
              >
                {item.location}
              </Text>
            </View>
          </View>
        </View>

        {/* Everything needed to judge whether this is the one to bring back. */}
        <View className="flex-row items-center flex-wrap gap-2 mt-4">
          <View className="bg-accent/10 dark:bg-accent-dark/10 px-3 py-1.5 rounded-lg">
            <Text className="text-accent dark:text-accent-dark text-xs font-bold">
              {item.radius}m radius
            </Text>
          </View>
          <View className="bg-muted dark:bg-muted-dark px-3 py-1.5 rounded-lg">
            <Text className="text-foreground dark:text-foreground-dark text-xs font-bold tracking-wider uppercase">
              {item.frequency === 'once' ? 'Once' : 'Always'}
            </Text>
          </View>
          {completed ? (
            <View className="bg-muted dark:bg-muted-dark px-3 py-1.5 rounded-lg">
              <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold tracking-wider uppercase">
                {item.triggered ? `Fired ${completed}` : `Off since ${completed}`}
              </Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={() => onSetUpAgain(item)}
          disabled={busy}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Set up ${item.title} again`}
          className={`mt-4 flex-row items-center justify-center rounded-2xl py-3 ${
            busy ? 'bg-muted dark:bg-muted-dark' : 'bg-accent dark:bg-accent-dark'
          }`}
        >
          <RotateCcw
            size={16}
            color={busy ? '#a0a0a0' : '#0a0a0a'}
            style={{ marginRight: 8 }}
          />
          <Text
            className={`font-bold ${
              busy
                ? 'text-muted-foreground dark:text-muted-foreground-dark'
                : 'text-accent-foreground dark:text-accent-foreground-dark'
            }`}
          >
            {busy ? 'Setting up…' : 'Set up again'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const { reminders, fetchReminders, updateReminder, error } = useReminders();
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Most recently finished first — the one just completed is the one most
  // likely to be wanted again.
  const past = useMemo(
    () =>
      reminders
        .filter(isPast)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [reminders]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReminders();
    setRefreshing(false);
  }, [fetchReminders]);

  // Reactivating the existing record rather than creating a copy is what keeps
  // the details intact — title, place, radius, icon, frequency and timeframe
  // all stay as they were, and no duplicate appears on Home.
  const handleSetUpAgain = useCallback(
    async (reminder: Reminder) => {
      setBusyId(reminder.id);
      const updated = await updateReminder(reminder.id, { triggered: false, enabled: true });
      setBusyId(null);

      if (updated) haptics.success();
      else haptics.error();
    },
    [updateReminder]
  );

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <FlatList
        data={past}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 128 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />
        }
        ListHeaderComponent={
          <View className="mb-8">
            <Text className="text-foreground dark:text-foreground-dark text-4xl font-bold mb-2">
              History
            </Text>
            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-base">
              {past.length > 0
                ? 'Reminders you have finished or switched off. Set any of them up again with its details intact.'
                : 'Reminders you finish or switch off collect here, ready to use again.'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center justify-center pt-16">
            <View className="bg-card dark:bg-card-dark rounded-3xl p-8 border border-border dark:border-border-dark w-full items-center">
              <HistoryIcon size={40} color={ACCENT} />
              <Text className="text-foreground dark:text-foreground-dark font-bold text-lg mt-4 mb-2 text-center">
                Nothing here yet
              </Text>
              <Text className="text-muted-foreground dark:text-muted-foreground-dark text-center">
                When a reminder fires or you switch one off, it moves here so you can bring it back
                without setting it up from scratch.
              </Text>
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <PastReminderCard
            item={item}
            index={index}
            busy={busyId === item.id}
            onSetUpAgain={handleSetUpAgain}
          />
        )}
      />

      {error ? (
        <View className="mx-6 mb-28 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3">
          <Text className="text-rose-500 text-sm">{error}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
