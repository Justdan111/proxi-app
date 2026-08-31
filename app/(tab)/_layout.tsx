import { Tabs, useRouter } from 'expo-router';
import { Home, Clock, Settings, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/themeContext';
import { ACCENT } from '@/lib/theme';
import { View, TouchableOpacity } from 'react-native';

// The bar floats clear of the screen edge, and the add button floats clear of
// the bar. Keeping them as two separate objects is what frees the middle tab:
// with three tabs the centre slot is Activity, so anything centred on the bar
// sits on top of its label. FAB_GAP is the air between them, and every content
// offset below is derived from these rather than hardcoded per screen.
const BAR_HEIGHT = 64;
const BAR_INSET = 16;
const FAB_SIZE = 60;
const FAB_GAP = 14;

export default function AppLayout() {
  const { isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // On a device with a home indicator the inset already lifts the bar; on one
  // without, 12 keeps it from sitting flush against the bottom edge.
  const barBottom = Math.max(insets.bottom, 12);

  const surface = isDark ? '#1a1a1a' : '#ffffff';
  const hairline = isDark ? '#2a2a2a' : '#e5e7eb';

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: ACCENT,
          tabBarInactiveTintColor: isDark ? '#a0a0a0' : '#6b7280',
          tabBarStyle: {
            position: 'absolute',
            left: BAR_INSET,
            right: BAR_INSET,
            bottom: barBottom,
            height: BAR_HEIGHT,
            // The default bottom tabs style adds its own safe-area padding and
            // a top border. Both fight a detached pill, so they are zeroed.
            paddingTop: 0,
            paddingBottom: 0,
            borderTopWidth: 0,
            borderRadius: BAR_HEIGHT / 2,
            backgroundColor: surface,
            borderWidth: 1,
            borderColor: hairline,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.45 : 0.12,
            shadowRadius: 16,
            elevation: 12,
          },
          tabBarItemStyle: {
            paddingVertical: 10,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            marginTop: 2,
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

      {/* Add reminder. Sits above the bar rather than on it, so all three
          labels stay readable. */}
      <View
        style={{
          position: 'absolute',
          bottom: barBottom + BAR_HEIGHT + FAB_GAP,
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
