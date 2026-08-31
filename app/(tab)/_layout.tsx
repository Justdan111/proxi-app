import { Tabs, useRouter } from 'expo-router';
import { Home, Clock, History, Settings, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/themeContext';
import { ACCENT } from '@/lib/theme';
import { View, TouchableOpacity } from 'react-native';

// The bar is docked to the bottom edge. The add button sits above it rather
// than on it: centred on the bar it lands on a tab's label — the middle slot
// with three tabs, the seam between two with four. FAB_GAP is the air between
// the button and the bar.
const BAR_HEIGHT = 70;
const FAB_SIZE = 60;
const FAB_GAP = 12;

export default function AppLayout() {
  const { isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: ACCENT,
          tabBarInactiveTintColor: isDark ? '#a0a0a0' : '#6b7280',
          tabBarStyle: {
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
            borderTopColor: isDark ? '#2a2a2a' : '#e5e7eb',
            borderTopWidth: 1,
            height: BAR_HEIGHT + insets.bottom,
            paddingBottom: insets.bottom + 8,
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
            title: 'Home',
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarLabel: 'History',
            tabBarIcon: ({ color, size }) => <History color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="activity"
          options={{
            title: 'Activity',
            tabBarLabel: 'Activity',
            tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />,
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

      {/* Add reminder. Cleared of the bar so every label stays readable. */}
      <View
        style={{
          position: 'absolute',
          bottom: BAR_HEIGHT + insets.bottom + FAB_GAP,
          alignSelf: 'center',
          zIndex: 100,
        }}
      >
        <TouchableOpacity
          onPress={() => router.push('/add-reminder')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Add reminder"
          style={{
            backgroundColor: ACCENT,
            borderRadius: FAB_SIZE / 2,
            width: FAB_SIZE,
            height: FAB_SIZE,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
            elevation: 12,
          }}
        >
          {/* Near-black on mint, per the palette's own accent-foreground.
              White on #00D4AA is about 1.9:1 and fails contrast. */}
          <Plus size={28} color="#0a0a0a" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
