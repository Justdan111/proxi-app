import { Tabs, useRouter } from 'expo-router';
import { Home, MapPin, Clock, Settings, Plus, BookAIcon } from 'lucide-react-native';
import { useTheme } from '@/context/themeContext';
import { View, TouchableOpacity } from 'react-native';

export default function AppLayout() {
  const { isDark } = useTheme();
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#00d4d4',
          tabBarInactiveTintColor: isDark ? '#a0a0a0' : '#6b7280',
          tabBarStyle: {
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
            borderTopColor: isDark ? '#2a2a2a' : '#e5e7eb',
            borderTopWidth: 1,
            height: 70,
            paddingBottom: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            marginTop: 4,
            fontWeight: '500',
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Dashboard',
            tabBarLabel: 'Dashboard',
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="explorer"
          options={{
            title: 'Explorer',
            tabBarLabel: 'Explorer',
            tabBarIcon: ({ color, size }) => <BookAIcon color={color} size={size} />,
            tabBarItemStyle: { marginRight: 23 },
          }}
        />
        <Tabs.Screen
          name="activity"
          options={{
            title: 'Activity',
            tabBarLabel: 'Activity',
            tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />,
            tabBarItemStyle: { marginLeft: 23 },
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarLabel: 'Settings',
            tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
          }}
        />
      </Tabs>

      {/* Floating Action Button */}
      <View
        style={{
          position: 'absolute',
          bottom: 25,
          alignSelf: 'center',
          zIndex: 100,
        }}
      >
        <TouchableOpacity
          onPress={() => router.push('/add-reminder')}
          activeOpacity={0.8}
          style={{
            backgroundColor: '#00d4d4',
            borderRadius: 32,
            width: 64,
            height: 64,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 4,
            borderColor: isDark ? '#1a1a1a' : '#ffffff',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 12,
          }}
        >
          <Plus size={30} color="#ffffff" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
