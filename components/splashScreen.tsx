

import React, { useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

export default function SplashScreen() {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

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
  }, []);

  return (
    <View className="flex-1 bg-background dark:bg-background-dark items-center justify-center">
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <View className="items-center">
          <Svg width={200} height={200} viewBox="0 0 200 200">
            <Defs>
              <RadialGradient id="dotGradient" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#00d4d4" stopOpacity="0.8" />
                <Stop offset="100%" stopColor="#00d4d4" stopOpacity="0.2" />
              </RadialGradient>
            </Defs>
            <Circle cx="100" cy="100" r="80" fill="none" stroke="#3a3a3a" strokeWidth="1" />
            {Array.from({ length: 144 }).map((_, i) => {
              const angle = (i / 144) * Math.PI * 2;
              const radius = 70 + Math.sin(angle * 3) * 10;
              const x = 100 + Math.cos(angle) * radius;
              const y = 100 + Math.sin(angle) * radius;
              const opacity = 0.3 + (Math.sin(angle) * 0.7);
              return (
                <Circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="1.5"
                  fill="#00d4d4"
                  opacity={opacity}
                />
              );
            })}
          </Svg>
        </View>
      </Animated.View>

      <Animated.View style={{ opacity: fadeAnim, marginTop: 40 }}>
        <Text className="text-foreground dark:text-foreground-dark text-2xl font-semibold">PROXI APP</Text>
        <Text className="text-muted-foreground dark:text-muted-foreground-dark text-sm text-center mt-2">
          Reminding you when you&apos;re near
        </Text>
      </Animated.View>
    </View>
  );
}
