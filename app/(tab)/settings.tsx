

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
} from 'react-native';
import { Moon, Sun, Bell, Info, LogOut } from 'lucide-react-native';
import { useTheme } from '@/context/themeContext';
import { useAuth } from '@/context/authContext';

export default function SettingsScreen() {
  const { isDark, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [notifications, setNotifications] = useState(true);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.log('[v0] Logout error:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="border-b border-border px-6 py-6">
          <View className="flex-row items-center justify-between">
            <View className="w-6" />
            <Text className="text-lg font-bold text-foreground">SETTINGS</Text>
            <View className="w-6" />
          </View>
        </View>

        {/* Settings List */}
        <View className="flex-1">
          {/* Appearance Section */}
          <View className="border-b border-border px-6 py-6">
            <Text className="text-xs font-semibold uppercase text-muted-foreground mb-4 tracking-wider">
              Appearance
            </Text>

            <TouchableOpacity
              onPress={toggleTheme}
              className="flex-row items-center justify-between rounded-lg border border-border bg-card px-4 py-4"
            >
              <Sun size={20} color="#00d4d4" />
              <View className="ml-3">
                <Text className="font-semibold text-foreground">
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {isDark ? 'Easy on the eyes' : 'Bright and clean'}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#3a3a3a', true: '#00d4d4' }}
                thumbColor={isDark ? '#000000' : '#ffffff'}
              />
            </TouchableOpacity>
          </View>

          {/* Notifications Section */}
          <View className="border-b border-border px-6 py-6">
            <Text className="text-xs font-semibold uppercase text-muted-foreground mb-4 tracking-wider">
              Notifications
            </Text>

            <TouchableOpacity
              onPress={() => setNotifications(!notifications)}
              className="flex-row items-center justify-between rounded-lg border border-border bg-card px-4 py-4"
            >
              <View className="flex-row items-center">
                <Bell size={20} color="#00d4d4" />
                <View className="ml-3">
                  <Text className="font-semibold text-foreground">Location Alerts</Text>
                  <Text className="text-xs text-muted-foreground">
                    {notifications ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#3a3a3a', true: '#00d4d4' }}
                thumbColor={notifications ? '#000000' : '#ffffff'}
              />
            </TouchableOpacity>
          </View>

          {/* About Section */}
          <View className="border-b border-border px-6 py-6">
            <Text className="text-xs font-semibold uppercase text-muted-foreground mb-4 tracking-wider">
              About
            </Text>

            <View className="rounded-lg border border-border bg-card px-4 py-4">
              <View className="flex-row items-center">
                <Info size={20} color="#00d4d4" />
                <View className="ml-3">
                  <Text className="font-semibold text-foreground">About Proxi</Text>
                  <Text className="text-xs text-muted-foreground mt-1">
                    Smart reminders, right where you need them.
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-1">
                    Version 1.0.0
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <View className="border-t border-border px-6 py-6">
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center justify-center rounded-full bg-destructive/20 px-6 py-4"
          >
            <LogOut size={18} color="#ef4444" />
            <Text className="text-destructive font-semibold ml-2">LOG OUT</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
