import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type WelcomeScreenProps = {
  onNavigate: (screen: 'signup' | 'login') => void;
};

export default function WelcomeScreen({ onNavigate }: WelcomeScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <View className="flex-1 bg-background dark:bg-background-dark items-center justify-between">
      {/* Dotted Circle Pattern - Centered */}
      <Animated.View style={{ opacity: fadeAnim }} className="flex-1 items-center justify-center">
        <Svg width={350} height={350} viewBox="0 0 350 350">
          {Array.from({ length: 30 }).map((_, ring) => {
            const dotsInRing = Math.floor(24 + ring * 6);
            const radius = 8 + ring * 9;
            
            return Array.from({ length: dotsInRing }).map((_, i) => {
              const angle = (i / dotsInRing) * Math.PI * 2;
              const x = 175 + Math.cos(angle) * radius;
              const y = 175 + Math.sin(angle) * radius;
              const dotOpacity = Math.max(0.1, 1 - (ring / 30) * 0.9);
              
              return (
                <Circle
                  key={`${ring}-${i}`}
                  cx={x}
                  cy={y}
                  r="0.8"
                  fill="#4a4a5e"
                  opacity={dotOpacity}
                />
              );
            });
          })}
        </Svg>
      </Animated.View>

      {/* Bottom Section */}
      <Animated.View 
        style={{ opacity: fadeAnim }} 
        className="pb-12 w-full px-6"
      >
        {/* App Title */}
        <Text 
          className="text-foreground dark:text-foreground-dark text-center mb-3 font-bold"
          style={{ fontSize: 48, letterSpacing: 4, fontWeight: '800' }}
        >
          PROXI
        </Text>

        {/* Subtitle */}
        <Text className="text-muted-foreground dark:text-muted-foreground-dark text-base text-center leading-6 mb-16 opacity-70">
          Smart reminders, right{'\n'}where you need them.
        </Text>

        {/* Get Started Button */}
        <TouchableOpacity
          onPress={() => onNavigate('signup')}
          className="bg-primary dark:bg-primary-dark rounded-full py-5 mb-4 items-center active:opacity-80"
        >
          <Text className="text-primary-foreground dark:text-primary-foreground-dark text-lg font-semibold">
            Get Started
          </Text>
        </TouchableOpacity>

        {/* Sign In Button */}
        <TouchableOpacity
          onPress={() => onNavigate('login')}
          className="bg-transparent border border-border dark:border-border-dark rounded-full py-5 items-center active:opacity-80"
        >
          <Text className="text-foreground dark:text-foreground-dark text-lg font-medium">
            Sign In
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}