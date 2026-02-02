import React, { useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { Check, MapPin, Bell } from 'lucide-react-native';

const activities = [
  {
    id: '1',
    section: 'today',
    icon: 'check',
    title: 'Bought fuel at Shell',
    subtitle: 'Auto-completed at location',
    time: '10:24 AM',
    type: 'completed',
  },
  {
    id: '2',
    section: 'today',
    icon: 'location',
    title: 'Visited Coffee Collective',
    subtitle: 'Stay duration: 45 mins',
    time: '8:45 AM',
    type: 'visited',
  },
  {
    id: '3',
    section: 'yesterday',
    icon: 'bell',
    title: 'Groceries at Netto',
    subtitle: 'Reminder triggered by radius',
    time: '6:12 PM',
    type: 'triggered',
  },
  {
    id: '4',
    section: 'yesterday',
    icon: 'location',
    title: 'Visited SATS Fitness',
    subtitle: 'Completed daily goal',
    time: '4:30 PM',
    type: 'visited',
  },
];

export default function ActivityScreen() {
  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);

  useEffect(() => {
    // Header animation
    headerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const getIconComponent = (iconType: string) => {
    switch (iconType) {
      case 'check':
        return <Check size={20} className="text-accent dark:text-accent-dark" />;
      case 'location':
        return <MapPin size={20} className="text-accent dark:text-accent-dark" />;
      case 'bell':
        return <Bell size={20} className="text-muted-foreground dark:text-muted-foreground-dark" />;
      default:
        return <MapPin size={20} className="text-accent dark:text-accent-dark" />;
    }
  };

  const getIconBackground = (iconType: string) => {
    if (iconType === 'bell') {
      return 'bg-muted dark:bg-muted-dark';
    }
    return 'bg-accent/20 dark:bg-accent-dark/20';
  };

  // Group activities by section
  const todayActivities = activities.filter((a) => a.section === 'today');
  const yesterdayActivities = activities.filter((a) => a.section === 'yesterday');

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-6 pb-32">
          {/* Header */}
          <Animated.View style={headerAnimatedStyle} className="mb-8">
            <Text className="text-foreground dark:text-foreground-dark text-4xl font-bold mb-2">
              Activity
            </Text>
          </Animated.View>

          {/* Today Section */}
          <View className="mb-8">
            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase tracking-[3px] mb-4">
              Today
            </Text>
            <View className="gap-3">
              {todayActivities.map((activity, index) => (
                <Animated.View
                  key={activity.id}
                  entering={FadeInDown.delay(index * 100).springify()}
                >
                  <View className="bg-card dark:bg-card-dark rounded-3xl p-5 border border-border dark:border-border-dark">
                    <View className="flex-row items-start">
                      {/* Icon */}
                      <View className={`${getIconBackground(activity.icon)} rounded-2xl p-3 mr-4`}>
                        {getIconComponent(activity.icon)}
                      </View>

                      {/* Content */}
                      <View className="flex-1 mr-3">
                        <Text className="text-foreground dark:text-foreground-dark font-bold text-base mb-1">
                          {activity.title}
                        </Text>
                        <Text className="text-muted-foreground dark:text-muted-foreground-dark text-sm">
                          {activity.subtitle}
                        </Text>
                      </View>

                      {/* Time */}
                      <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs mt-1">
                        {activity.time}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* Yesterday Section */}
          <View className="mb-8">
            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase tracking-[3px] mb-4">
              Yesterday
            </Text>
            <View className="gap-3">
              {yesterdayActivities.map((activity, index) => (
                <Animated.View
                  key={activity.id}
                  entering={FadeInDown.delay((todayActivities.length + index) * 100).springify()}
                >
                  <View className="bg-card dark:bg-card-dark rounded-3xl p-5 border border-border dark:border-border-dark">
                    <View className="flex-row items-start">
                      {/* Icon */}
                      <View className={`${getIconBackground(activity.icon)} rounded-2xl p-3 mr-4`}>
                        {getIconComponent(activity.icon)}
                      </View>

                      {/* Content */}
                      <View className="flex-1 mr-3">
                        <Text className="text-foreground dark:text-foreground-dark font-bold text-base mb-1">
                          {activity.title}
                        </Text>
                        <Text className="text-muted-foreground dark:text-muted-foreground-dark text-sm">
                          {activity.subtitle}
                        </Text>
                      </View>

                      {/* Time */}
                      <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs mt-1">
                        {activity.time}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}