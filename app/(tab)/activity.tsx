import React from 'react';
import { View, Text, ScrollView, SafeAreaView } from 'react-native';
import { Check, Clock } from 'lucide-react-native';

const activities = [
  {
    id: '1',
    icon: '✓',
    title: 'Bought fuel',
    location: 'Shell Station',
    time: '2 hours ago',
    type: 'completed',
  },
  {
    id: '2',
    icon: '🔔',
    title: 'Reminder triggered',
    location: 'Coffee Collective',
    time: '4 hours ago',
    type: 'triggered',
  },
  {
    id: '3',
    icon: '✓',
    title: 'Picked up dry cleaning',
    location: 'The Cleaners',
    time: '1 day ago',
    type: 'completed',
  },
  {
    id: '4',
    icon: '🔔',
    title: 'Reminder triggered',
    location: 'Gym',
    time: '2 days ago',
    type: 'triggered',
  },
];

export default function ActivityScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1">
        <View className="px-6 py-6">
          <Text className="text-foreground text-2xl font-bold mb-2">Activity</Text>
          <Text className="text-muted-foreground text-sm mb-6">
            Your reminder history and interactions
          </Text>

          <View className="space-y-3">
            {activities.map((activity) => (
              <View key={activity.id} className="bg-card rounded-2xl p-4 border border-border">
                <View className="flex-row items-center">
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                      activity.type === 'completed' ? 'bg-accent/20' : 'bg-primary/20'
                    }`}
                  >
                    <Text className="text-lg">{activity.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold">{activity.title}</Text>
                    <Text className="text-muted-foreground text-xs mt-1">{activity.location}</Text>
                  </View>
                  <Text className="text-muted-foreground text-xs italic">{activity.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
