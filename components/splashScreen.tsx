import React, { useEffect, useState } from 'react';
import { View, Text, Animated, Image } from 'react-native';

// Shown while the stored token is read. It mirrors the native splash — same
// mark, same ground — so the handover from the launch screen to JS is not a
// visible change of scene.
export default function SplashScreen() {
  // Created once via lazy state, not rebuilt per render: `new Animated.Value()`
  // in the render body handed the effect a different object on every pass, so
  // the animation restarted from 0 each time and could never settle. A ref
  // would also work but reading `.current` during render is what the React
  // Compiler forbids, and this project has it enabled.
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [scaleAnim] = useState(() => new Animated.Value(0.8));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <View className="flex-1 bg-background dark:bg-background-dark items-center justify-center">
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <Image
          source={require('@/assets/images/splash-icon.png')}
          style={{ width: 180, height: 180 }}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel="Proxi"
        />
      </Animated.View>

      <Animated.View style={{ opacity: fadeAnim, marginTop: 32 }}>
        <Text className="text-foreground dark:text-foreground-dark text-2xl font-semibold text-center">
          Proxi
        </Text>
        <Text className="text-muted-foreground dark:text-muted-foreground-dark text-sm text-center mt-2">
          Reminding you when you&apos;re near
        </Text>
      </Animated.View>
    </View>
  );
}
