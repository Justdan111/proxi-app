

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
} from 'react-native';
import { MapPin } from 'lucide-react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';

export default function AddReminderScreen() {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('Coffee Collective');
  const [radius, setRadius] = useState('300m');
  const [saved, setSaved] = useState(false);

  const radiusOptions = ['100m', '300m', '500m'];

  const handleSave = () => {
    if (title) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1">
        <View className="px-6 py-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-8">
            <View className="w-6" />
            <Text className="text-lg font-bold text-foreground">NEW REMINDER</Text>
            <View className="w-6" />
          </View>

          {/* Reminder Title */}
          <View className="mb-8">
            <Text className="text-xs font-semibold uppercase text-muted-foreground mb-3 tracking-wider">
              What&apos;s the plan?
            </Text>
            <TextInput
              placeholder="Remind me to..."
              placeholderTextColor="#a0a0a0"
              value={title}
              onChangeText={setTitle}
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-lg text-foreground"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Location */}
          <View className="mb-8">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Location
              </Text>
              <TouchableOpacity>
                <Text className="text-accent text-sm font-semibold">Change</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center rounded-lg border border-border bg-card px-4 py-3">
              <View className="bg-accent/10 rounded-full p-2 mr-3 items-center justify-center">
                <MapPin size={16} color="#00d4d4" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-foreground">{location}</Text>
                <Text className="text-xs text-muted-foreground mt-1">
                  Jægersborggade 10, Copenhagen
                </Text>
              </View>
            </View>
          </View>

          {/* Proximity Radius */}
          <View className="mb-8">
            <Text className="text-xs font-semibold uppercase text-muted-foreground mb-3 tracking-wider">
              Proximity Radius
            </Text>

            {/* Radius Buttons */}
            <View className="flex-row gap-2 mb-6">
              {radiusOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => setRadius(option)}
                  className={`flex-1 rounded-lg py-3 items-center ${
                    radius === option ? 'bg-accent' : 'bg-card border border-border'
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      radius === option ? 'text-accent-foreground' : 'text-foreground'
                    }`}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Radius Visualization */}
            <View className="bg-card rounded-lg border border-border p-4 items-center justify-center h-64 overflow-hidden">
              <Svg width={200} height={200} viewBox="0 0 200 200">
                <Defs>
                  <RadialGradient id="radiusGradient" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#00d4d4" stopOpacity="0.2" />
                    <Stop offset="100%" stopColor="#00d4d4" stopOpacity="0.02" />
                  </RadialGradient>
                </Defs>
                {/* Grid dots */}
                {Array.from({ length: 144 }).map((_, i) => {
                  const angle = (i / 144) * Math.PI * 2;
                  const radius = 80;
                  const x = 100 + Math.cos(angle) * radius;
                  const y = 100 + Math.sin(angle) * radius;
                  return (
                    <Circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="0.8"
                      fill="#3a3a3a"
                    />
                  );
                })}
                {/* Radius circle */}
                <Circle
                  cx="100"
                  cy="100"
                  r="70"
                  fill="url(#radiusGradient)"
                  stroke="#00d4d4"
                  strokeWidth="2"
                />
                {/* Center point */}
                <Circle cx="100" cy="100" r="3" fill="#00d4d4" />
              </Svg>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <Animated.View entering={FadeIn} className="px-6 pb-6">
        <TouchableOpacity
          onPress={handleSave}
          disabled={!title}
          className={`rounded-full py-4 items-center ${!title ? 'bg-muted' : 'bg-accent'}`}
        >
          <Text
            className={`font-semibold text-lg ${
              !title ? 'text-muted-foreground' : 'text-accent-foreground'
            }`}
          >
            SAVE REMINDER
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Success Modal */}
      <Modal transparent visible={saved} animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center">
          <Animated.View entering={SlideInUp} className="bg-accent rounded-2xl px-6 py-4 items-center">
            <Text className="text-accent-foreground font-semibold text-lg">✓ Reminder Saved</Text>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
