import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, Text, TouchableOpacity,View,
} from 'react-native';
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withSpring, withTiming,
} from 'react-native-reanimated';
import { AlertCircle, Bell, MapPin, RefreshCcw, Trash2 } from 'lucide-react-native';
import { activitiesApi, Activity } from '@/lib/api';
import { getApiError } from '@/lib/api/errors';
import { ACCENT } from '@/lib/theme';

type ActivityGroup = {
  key: string;
  label: string;
  sortTime: number;
  items: Activity[];
};

const eventMeta = {
  triggered: {
    label: 'Triggered nearby',
    icon: MapPin,
    iconClass: 'text-accent dark:text-accent-dark',
    backgroundClass: 'bg-accent/20 dark:bg-accent-dark/20',
  },
  created: {
    label: 'Reminder created',
    icon: Bell,
    iconClass: 'text-accent dark:text-accent-dark',
    backgroundClass: 'bg-accent/20 dark:bg-accent-dark/20',
  },
  toggled: {
    label: 'Reminder toggled',
    icon: RefreshCcw,
    iconClass: 'text-accent dark:text-accent-dark',
    backgroundClass: 'bg-accent/20 dark:bg-accent-dark/20',
  },
  deleted: {
    label: 'Reminder deleted',
    icon: Trash2,
    iconClass: 'text-rose-500',
    backgroundClass: 'bg-rose-500/15',
  },
} as const;

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getSectionLabel(date: Date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';

  const options: Intl.DateTimeFormatOptions =
    date.getFullYear() === today.getFullYear()
      ? { month: 'short', day: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' };

  return date.toLocaleDateString(undefined, options);
}

function formatTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function ActivityScreen() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      const data = await activitiesApi.getAll();
      setActivities(data);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    load();
  }, [headerOpacity, headerTranslateY, load]);

  const groupedActivities = useMemo<ActivityGroup[]>(() => {
    const groups = new Map<string, ActivityGroup>();

    activities
      .slice()
      .sort((left, right) => new Date(right.triggeredAt).getTime() - new Date(left.triggeredAt).getTime())
      .forEach((activity) => {
        const date = new Date(activity.triggeredAt);
        const groupLabel = Number.isNaN(date.getTime()) ? 'Recent' : getSectionLabel(date);
        const groupSortTime = Number.isNaN(date.getTime()) ? 0 : date.getTime();
        const existing = groups.get(groupLabel);

        if (!existing) {
          groups.set(groupLabel, {
            key: groupLabel,
            label: groupLabel,
            sortTime: groupSortTime,
            items: [activity],
          });
          return;
        }

        existing.items.push(activity);
        existing.sortTime = Math.max(existing.sortTime, groupSortTime);
      });

    return Array.from(groups.values()).sort((left, right) => right.sortTime - left.sortTime);
  }, [activities]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const renderActivityCard = (activity: Activity, index: number) => {
    const meta = eventMeta[activity.eventType] ?? eventMeta.created;
    const Icon = meta.icon;
    const hasValidDate = !Number.isNaN(new Date(activity.triggeredAt).getTime());

    return (
      <Animated.View key={activity.id} entering={FadeInDown.delay(index * 80).springify()}>
        <View className="bg-card dark:bg-card-dark rounded-3xl p-5 border border-border dark:border-border-dark">
          <View className="flex-row items-start">
            <View className={`${meta.backgroundClass} rounded-2xl p-3 mr-4`}>
              <Icon size={20} className={meta.iconClass} />
            </View>

            <View className="flex-1 mr-3">
              <Text className="text-foreground dark:text-foreground-dark font-bold text-base mb-1">
                {activity.reminderTitle}
              </Text>
              <Text className="text-muted-foreground dark:text-muted-foreground-dark text-sm">
                {meta.label}{activity.location ? ` · ${activity.location}` : ''}
              </Text>
            </View>

            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs mt-1 text-right">
              {hasValidDate ? formatTime(activity.triggeredAt) : 'Unknown time'}
            </Text>
          </View>

          {hasValidDate && (
            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs mt-3">
              {formatDateTime(activity.triggeredAt)}
            </Text>
          )}
        </View>
      </Animated.View>
    );
  };

  if (isLoading && activities.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={ACCENT} />
        }
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="px-6 pt-6 pb-32 flex-1">
          <Animated.View style={headerAnimatedStyle} className="mb-8">
            <Text className="text-foreground dark:text-foreground-dark text-4xl font-bold mb-2">
              Activity
            </Text>
            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-base">
              Recent reminder events will appear here
            </Text>
          </Animated.View>

          {error && activities.length === 0 ? (
            <View className="flex-1 items-center justify-center pt-16">
              <View className="bg-card dark:bg-card-dark rounded-3xl p-8 border border-border dark:border-border-dark w-full items-center">
                <AlertCircle size={40} color="#ef4444" />
                <Text className="text-foreground dark:text-foreground-dark font-bold text-lg mt-4 mb-2 text-center">
                  Could not load activity
                </Text>
                <Text className="text-muted-foreground dark:text-muted-foreground-dark text-center mb-6">
                  {error}
                </Text>
                <TouchableOpacity
                  onPress={() => load(false)}
                  className="bg-accent dark:bg-accent-dark px-5 py-3 rounded-full"
                >
                  <Text className="text-accent-foreground dark:text-accent-foreground-dark font-bold">
                    Try Again
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : groupedActivities.length === 0 ? (
            <View className="flex-1 items-center justify-center pt-16">
              <View className="bg-card dark:bg-card-dark rounded-3xl p-8 border border-border dark:border-border-dark w-full items-center">
                <Bell size={40} color={ACCENT} />
                <Text className="text-foreground dark:text-foreground-dark font-bold text-lg mt-4 mb-2 text-center">
                  No activity yet
                </Text>
                <Text className="text-muted-foreground dark:text-muted-foreground-dark text-center">
                  Reminder events will appear here once they are created, updated, triggered, or deleted.
                </Text>
              </View>
            </View>
          ) : (
            groupedActivities.map((group) => (
              <View key={group.key} className="mb-8">
                <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase tracking-[3px] mb-4">
                  {group.label}
                </Text>
                <View className="gap-3">
                  {group.items.map((activity, index) => renderActivityCard(activity, index))}
                </View>
              </View>
            ))
          )}

          {error && activities.length > 0 ? (
            <View className="mt-2 mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 flex-row items-start">
              <AlertCircle size={18} color="#ef4444" style={{ marginTop: 2, marginRight: 10 }} />
              <Text className="flex-1 text-rose-500 text-sm">{error}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
