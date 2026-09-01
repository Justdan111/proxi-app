import { Tabs, useRouter } from 'expo-router';
import { Home, Clock, History, Settings, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/themeContext';
import { ACCENT } from '@/lib/theme';
import { View, TouchableOpacity } from 'react-native';

// The add button is the bar's middle slot, not an overlay on top of it: two
// tabs, the button, two tabs. That is what keeps it clear of every label, and
// it is why `add.tsx` exists — the layout needs a real screen to reserve the
// slot.
//
// FAB_RISE is how far the button breaks the bar's top edge. It sits mostly
// inside the bar and protrudes a little, rather than floating above it.
const BAR_HEIGHT = 70;
const BAR_PAD_TOP = 12;
const FAB_SIZE = 58;
const FAB_RISE = 8;

export default function AppLayout() {
  const { isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const surface = isDark ? '#1a1a1a' : '#ffffff';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACCENT,
        tabBarInactiveTintColor: isDark ? '#a0a0a0' : '#6b7280',
        tabBarStyle: {
          backgroundColor: surface,
          // No top rule: the bar already reads as its own surface against the
          // darker page, and a hairline competes with the button breaking it.
          borderTopWidth: 0,
          height: BAR_HEIGHT + insets.bottom,
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
        name="add"
        options={{
          title: 'Add reminder',
          tabBarButton: () => (
            <View style={{ flex: 1, alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => router.push('/add-reminder')}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Add reminder"
                style={{
                  marginTop: -(FAB_RISE + BAR_PAD_TOP),
                  backgroundColor: ACCENT,
                  borderRadius: FAB_SIZE / 2,
                  width: FAB_SIZE,
                  height: FAB_SIZE,
                  justifyContent: 'center',
                  alignItems: 'center',
                  // A collar in the bar's own colour, so the circle reads as
                  // seated in the bar rather than pasted onto it.
                  borderWidth: 4,
                  borderColor: surface,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 10,
                }}
              >
                <Plus size={26} color="#ffffff" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          ),
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
  );
}
