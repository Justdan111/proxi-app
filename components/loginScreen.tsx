import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Eye, EyeOff, ArrowRight, MapPin } from 'lucide-react-native';
import { useAuth } from '@/context/authContext';

type LogInScreenProps = {
  onNavigate: (screen: 'welcome' | 'signup') => void;
};

export default function LogInScreen({ onNavigate }: LogInScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const emailOpacity = useSharedValue(0);
  const emailTranslateY = useSharedValue(20);
  const passwordOpacity = useSharedValue(0);
  const passwordTranslateY = useSharedValue(20);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.9);
  const footerOpacity = useSharedValue(0);
  const footerTranslateY = useSharedValue(20);

  useEffect(() => {
    // Staggered entrance animations
    headerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });

    setTimeout(() => {
      emailOpacity.value = withTiming(1, { duration: 500 });
      emailTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    }, 100);

    setTimeout(() => {
      passwordOpacity.value = withTiming(1, { duration: 500 });
      passwordTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    }, 200);

    setTimeout(() => {
      buttonOpacity.value = withTiming(1, { duration: 500 });
      buttonScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    }, 300);

    setTimeout(() => {
      footerOpacity.value = withTiming(1, { duration: 500 });
      footerTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    }, 400);
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const emailAnimatedStyle = useAnimatedStyle(() => ({
    opacity: emailOpacity.value,
    transform: [{ translateY: emailTranslateY.value }],
  }));

  const passwordAnimatedStyle = useAnimatedStyle(() => ({
    opacity: passwordOpacity.value,
    transform: [{ translateY: passwordTranslateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  const footerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
    transform: [{ translateY: footerTranslateY.value }],
  }));

  const handleLogin = async () => {
    if (email && password) {
      setLoading(true);
      try {
        await login(email, password);
      } catch (error) {
        console.log('[v0] Login error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <ScrollView className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-1 px-6 pt-16">
        {/* Header */}
        <Animated.View style={headerAnimatedStyle} className="mb-8">
          <Text className="text-foreground dark:text-foreground-dark text-4xl font-bold mb-3">
            Log In
          </Text>
          <Text className="text-muted-foreground dark:text-muted-foreground-dark text-base">
            Welcome back to intelligent reminders.
          </Text>
        </Animated.View>

        {/* Form */}
        <View className="mb-8">
          {/* Email Field */}
          <Animated.View style={emailAnimatedStyle} className="mb-6">
            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-semibold uppercase mb-3 tracking-wider">
              EMAIL
            </Text>
            <TextInput
              placeholder="hello@example.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              className="w-full bg-card dark:bg-card-dark px-4 py-4 text-foreground dark:text-foreground-dark text-base rounded-xl"
              editable={!loading}
            />
          </Animated.View>

          {/* Password Field */}
          <Animated.View style={passwordAnimatedStyle} className="mb-6">
            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-semibold uppercase mb-3 tracking-wider">
              PASSWORD
            </Text>
            <View className="flex-row items-center bg-card dark:bg-card-dark rounded-xl">
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                className="flex-1 px-4 py-4 text-foreground dark:text-foreground-dark text-base"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="px-4"
              >
                {showPassword ? (
                  <Eye size={20} className="text-muted-foreground dark:text-muted-foreground-dark" />
                ) : (
                  <EyeOff size={20} className="text-muted-foreground dark:text-muted-foreground-dark" />
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>

        {/* Continue Button */}
        <Animated.View style={buttonAnimatedStyle}>
          <TouchableOpacity
            onPress={handleLogin}
            disabled={!email || !password || loading}
            className={`w-full rounded-full py-4 items-center mb-6 flex-row justify-center ${
              !email || !password || loading 
                ? 'bg-muted dark:bg-muted-dark' 
                : 'bg-primary dark:bg-primary-dark'
            }`}
          >
            <Text
              className={`font-semibold text-lg mr-2 ${
                !email || !password || loading
                  ? 'text-muted-foreground dark:text-muted-foreground-dark'
                  : 'text-primary-foreground dark:text-primary-foreground-dark'
              }`}
            >
              {loading ? 'LOGGING IN...' : 'Continue'}
            </Text>
            {!loading && (
              <ArrowRight 
                size={20} 
                className={
                  !email || !password 
                    ? 'text-muted-foreground dark:text-muted-foreground-dark' 
                    : 'text-primary-foreground dark:text-primary-foreground-dark'
                } 
              />
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Don't have account */}
        <Animated.View style={buttonAnimatedStyle} className="flex-row justify-center mb-8">
          <Text className="text-muted-foreground dark:text-muted-foreground-dark text-base">
            Don&apos;t have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => onNavigate('signup')}>
            <Text className="text-accent dark:text-accent-dark text-base font-semibold">
              Sign up
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom Info */}
        <Animated.View style={footerAnimatedStyle} className="flex-1 justify-end pb-8">
          <View className="flex-row items-start bg-card dark:bg-card-dark px-4 py-4 rounded-xl">
            <MapPin size={20} className="text-accent dark:text-accent-dark mr-3 mt-0.5" />
            <Text className="flex-1 text-muted-foreground dark:text-muted-foreground-dark text-sm">
              Proxi only notifies you when you&apos;re nearby.
            </Text>
          </View>
        </Animated.View>
      </View>
    </ScrollView>
  );
}