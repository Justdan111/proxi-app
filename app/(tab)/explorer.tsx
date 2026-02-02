

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, TextInput } from 'react-native';
import { Plus, MapPin, Clock } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

export default function ExplorerScreen() {
  const router = useRouter();
  const [reminders, setReminders] = useState<{
    id: string;
    title: string;
    location: string;
    radius: string;
    icon: string;
  }[]>([]);

  const addReminder = () => {
    const newReminder = {
      id: Math.random().toString(),
      title: 'New Reminder',
      location: 'Brooklyn, NY',
      radius: '100m',
      icon: '📍',
    };
    setReminders([...reminders, newReminder]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1">
        <View className="px-6 py-6">
          <Text className="text-foreground text-2xl font-bold mb-2">Explorer</Text>
          <Text className="text-muted-foreground text-sm mb-6">
            Create and manage your location-based reminders
          </Text>

          {reminders.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Text className="text-4xl mb-3">📭</Text>
              <Text className="text-foreground text-lg font-semibold mb-2">No Reminders Yet</Text>
              <Text className="text-muted-foreground text-sm text-center">
                Tap the plus button to create your first reminder
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {reminders.map((reminder, index) => (
                <Animated.View key={reminder.id} entering={FadeInUp.delay(index * 100)}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    className="bg-card rounded-2xl p-4 border border-border mb-3"
                  >
                    <View className="flex-row items-center">
                      <Text className="text-2xl mr-3">{reminder.icon}</Text>
                      <View className="flex-1">
                        <Text className="text-foreground font-semibold">{reminder.title}</Text>
                        <View className="flex-row items-center mt-1">
                          <MapPin size={12} color="#a0a0a0" />
                          <Text className="text-muted-foreground text-xs ml-1">
                            {reminder.location}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}
