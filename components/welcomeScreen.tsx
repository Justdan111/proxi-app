

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

type WelcomeScreenProps = {
  onNavigate: (screen: 'signup' | 'login') => void;
};

export default function WelcomeScreen({ onNavigate }: WelcomeScreenProps) {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View className="flex-1 bg-background items-center justify-center px-6 py-12">
      <Animated.View style={{ opacity: fadeAnim }} className="items-center mb-12">
        <Svg width={160} height={160} viewBox="0 0 200 200">
          <Defs>
            <RadialGradient id="welcomeGradient" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#00d4d4" stopOpacity="0.9" />
              <Stop offset="100%" stopColor="#00d4d4" stopOpacity="0.1" />
            </RadialGradient>
          </Defs>
          {Array.from({ length: 144 }).map((_, i) => {
            const angle = (i / 144) * Math.PI * 2;
            const radius = 70;
            const x = 100 + Math.cos(angle) * radius;
            const y = 100 + Math.sin(angle) * radius;
            return (
              <Circle
                key={i}
                cx={x}
                cy={y}
                r="1.5"
                fill="#00d4d4"
                opacity={0.6}
              />
            );
          })}
        </Svg>
      </Animated.View>

      <Animated.View style={{ opacity: fadeAnim }} className="text-center mb-12">
        <Text className="text-foreground text-5xl font-bold mb-3">WELCOME</Text>
        <Text className="text-muted-foreground text-base">
          Never forget what matters — right where it matters.
        </Text>
      </Animated.View>

      <View className="w-full space-y-3">
        <TouchableOpacity
          onPress={() => onNavigate('signup')}
          className="bg-primary rounded-full py-4 px-6 items-center active:opacity-80"
        >
          <Text className="text-primary-foreground font-semibold text-lg">SIGN UP</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onNavigate('login')}
          className="border-2 border-muted rounded-full py-4 px-6 items-center active:opacity-80"
        >
          <Text className="text-foreground font-semibold text-lg">LOG IN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
