import { Tabs, useRouter } from 'expo-router';
import { Home, Clock, History, Settings, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/themeContext';
import { ACCENT } from '@/lib/theme';
import { View, TouchableOpacity } from 'react-native';

// The bar is docked to the bottom edge. The add button is centred, which with
// four tabs puts it in the seam between History and Activity rather than over a
// label, and FAB_LIFT holds it just clear of the bar's top edge. At three tabs
// the centre would be a label instead, so this depends on the tab count.
const BAR_HEIGHT = 70;
const BAR_PAD_TOP = 14;
const FAB_SIZE = 60;
const FAB_LIFT = 12;

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
            // Sits the icon and label lower in the bar, clear of the button
            // hanging over the top edge.
            paddingTop: BAR_PAD_TOP,
            paddingBottom: insets.bottom + 6,
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

      {/* Add reminder, in the History/Activity seam, lifted off the bar. */}
      <View
        style={{
          position: 'absolute',
          bottom: BAR_HEIGHT + insets.bottom + FAB_LIFT,
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
