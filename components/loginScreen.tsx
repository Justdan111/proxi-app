

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react-native';
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
    <ScrollView className="flex-1 bg-background">
      <View className="px-6 py-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => onNavigate('welcome')}>
            <ChevronLeft size={24} color="#a0a0a0" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">LOG IN</Text>
          <View className="w-6" />
        </View>

        {/* Form */}
        <View className="flex-1 py-4">
          {/* Email Field */}
          <View className="mb-6">
            <Text className="text-xs font-semibold uppercase text-muted-foreground mb-3 tracking-wider">
              Email
            </Text>
            <TextInput
              placeholder="hello@example.com"
              placeholderTextColor="#a0a0a0"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground"
              editable={!loading}
            />
          </View>

          {/* Password Field */}
          <View className="mb-6">
            <Text className="text-xs font-semibold uppercase text-muted-foreground mb-3 tracking-wider">
              Password
            </Text>
            <View className="flex-row items-center rounded-lg border border-border bg-card">
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#a0a0a0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                className="flex-1 px-4 py-3 text-foreground"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="px-4"
              >
                {showPassword ? (
                  <Eye size={20} color="#a0a0a0" />
                ) : (
                  <EyeOff size={20} color="#a0a0a0" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Buttons */}
        <View className="space-y-3 pb-6">
          <TouchableOpacity
            onPress={handleLogin}
            disabled={!email || !password || loading}
            className={`w-full rounded-full py-4 items-center ${
              !email || !password || loading ? 'bg-muted' : 'bg-accent'
            }`}
          >
            <Text
              className={`font-semibold text-lg ${
                !email || !password || loading
                  ? 'text-muted-foreground'
                  : 'text-accent-foreground'
              }`}
            >
              {loading ? 'LOGGING IN...' : 'LOG IN'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
