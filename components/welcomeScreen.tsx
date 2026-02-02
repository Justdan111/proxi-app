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
    <View className="flex-1 bg-background dark:bg-background-dark items-center">
      {/* Welcome Text */}
      <Animated.View style={{ opacity: fadeAnim }} className="mt-[120px]">
        <Text 
          className="text-foreground dark:text-foreground-dark text-[42px] tracking-[8px] font-normal"
          style={{ fontFamily: 'Courier' }}
        >
          WELCOME
        </Text>
      </Animated.View>

      {/* Dotted Circle Pattern */}
      <Animated.View style={{ opacity: fadeAnim }} className="mt-[60px]">
        <Svg width={280} height={280} viewBox="0 0 280 280">
          {Array.from({ length: 25 }).map((_, ring) => {
            const dotsInRing = Math.floor(20 + ring * 8);
            const radius = 10 + ring * 10;
            
            return Array.from({ length: dotsInRing }).map((_, i) => {
              const angle = (i / dotsInRing) * Math.PI * 2;
              const x = 140 + Math.cos(angle) * radius;
              const y = 140 + Math.sin(angle) * radius;
              const dotOpacity = Math.max(0.15, 1 - (ring / 25) * 0.85);
              
              return (
                <Circle
                  key={`${ring}-${i}`}
                  cx={x}
                  cy={y}
                  r="1.2"
                  fill="#22223b"
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
        className="flex-1 justify-end pb-20 w-full px-8"
      >
        {/* App Title */}
        <Text className="text-muted-foreground dark:text-muted-foreground-dark text-sm tracking-[3px] text-center mb-4 font-semibold">
          PROXI APP
        </Text>

        {/* Subtitle */}
        <Text className="text-foreground dark:text-foreground-dark text-base text-center leading-6 mb-10 opacity-90">
          Reminding you when you&apos;re near{'\n'}the places that matter.
        </Text>

        {/* Sign Up Button */}
        <TouchableOpacity
          onPress={() => onNavigate('signup')}
          className="bg-primary dark:bg-primary-dark rounded-full py-[18px] mb-4 items-center active:opacity-80"
        >
          <Text className="text-primary-foreground dark:text-primary-foreground-dark text-base font-semibold tracking-[2px]">
            SIGN UP
          </Text>
        </TouchableOpacity>

        {/* Log In Button */}
        <TouchableOpacity
          onPress={() => onNavigate('login')}
          className="bg-transparent border border-border dark:border-border-dark rounded-full py-[18px] items-center active:opacity-80"
        >
          <Text className="text-foreground dark:text-foreground-dark text-base font-semibold tracking-[2px]">
            LOG IN
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}