
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Search, Bell, MapPin } from 'lucide-react-native';
import { reminders as mockReminders } from '@/lib/mockData';

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const [reminders, setReminders] = useState(mockReminders);
  const [refreshing, setRefreshing] = useState(false);

  const filteredReminders = reminders.filter((reminder) =>
    reminder.title.toLowerCase().includes(search.toLowerCase()) ||
    reminder.location.toLowerCase().includes(search.toLowerCase())
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const toggleReminder = (id: string) => {
    setReminders((prevReminders) =>
      prevReminders.map((reminder) =>
        reminder.id === id
          ? { ...reminder, enabled: !reminder.enabled }
          : reminder
      )
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center justify-between border-b border-border">
          <View>
            <Text className="text-foreground text-2xl font-bold">{getGreeting()} 👋</Text>
            <View className="flex-row items-center mt-1">
              <MapPin size={14} color="#00d4d4" />
              <Text className="text-accent text-sm ml-1 font-medium">BROOKLYN, NY</Text>
            </View>
          </View>
          <TouchableOpacity className="bg-card rounded-full p-3">
            <Bell size={20} color="#f5f5f5" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View className="px-6 py-4">
          <View className="flex-row items-center bg-card rounded-full px-4 py-3 border border-border">
            <Search size={18} color="#a0a0a0" />
            <TextInput
              placeholder="Search reminders..."
              placeholderTextColor="#a0a0a0"
              value={search}
              onChangeText={setSearch}
              className="flex-1 ml-3 text-foreground"
            />
          </View>
        </View>

        {/* Active Reminders */}
        <View className="px-6 pb-2">
          <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            Active Proximities
          </Text>
        </View>

        {/* Reminders List */}
        <FlatList
          data={filteredReminders}
          keyExtractor={(item) => item.id}
          scrollEnabled
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View className="px-6 pb-3">
              <View className="bg-card rounded-2xl p-4 border border-border">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center flex-1">
                    <Text className="text-2xl mr-3">{item.icon}</Text>
                    <View className="flex-1">
                      <Text className="text-foreground font-semibold text-base">{item.title}</Text>
                      <Text className="text-muted-foreground text-xs mt-1">{item.location}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => toggleReminder(item.id)}
                    className={`w-12 h-7 rounded-full ${
                      item.enabled ? 'bg-accent' : 'bg-muted'
                    } flex items-center justify-center`}
                  >
                    <View
                      className={`w-5 h-5 rounded-full bg-primary ${
                        item.enabled ? 'ml-4' : 'mr-4'
                      }`}
                    />
                  </TouchableOpacity>
                </View>
                <View className="flex-row items-center justify-between">
                  <View className="bg-muted px-2 py-1 rounded">
                    <Text className="text-muted-foreground text-xs font-semibold">
                      {item.distance} AWAY
                    </Text>
                  </View>
                  <Text className="text-muted-foreground text-xs italic">{item.frequency}</Text>
                </View>
              </View>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-12">
              <Text className="text-muted-foreground text-center">No reminders found</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
