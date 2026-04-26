import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '@/context/authContext';

type ForgotPasswordScreenProps = {
  onNavigate: (screen: 'login') => void;
};

export default function ForgotPasswordScreen({ onNavigate }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { forgotPassword, error, clearError } = useAuth();

  const handleSubmit = async () => {
    if (!email || loading) return;

    setLoading(true);
    clearError();

    try {
      const success = await forgotPassword(email.trim());
      if (success) {
        setIsSubmitted(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-1 px-6 pt-16">
        <TouchableOpacity
          onPress={() => onNavigate('login')}
          className="flex-row items-center self-start mb-8"
          disabled={loading}
        >
          <ArrowLeft size={18} className="text-accent dark:text-accent-dark mr-2" />
          <Text className="text-accent dark:text-accent-dark text-sm font-semibold">Back to login</Text>
        </TouchableOpacity>

        <View className="mb-8">
          <Text className="text-foreground dark:text-foreground-dark text-4xl font-bold mb-3">
            Forgot Password
          </Text>
          <Text className="text-muted-foreground dark:text-muted-foreground-dark text-base">
            Enter your account email and we&apos;ll send reset instructions.
          </Text>
        </View>

        {isSubmitted ? (
          <View className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 mb-6">
            <View className="flex-row items-start">
              <CheckCircle2 size={20} className="text-emerald-500 mr-3 mt-0.5" />
              <Text className="flex-1 text-emerald-600 dark:text-emerald-400 text-sm">
                If an account exists for {email.trim()}, a reset link has been sent.
              </Text>
            </View>
          </View>
        ) : null}

        <View className="mb-6">
          <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-semibold uppercase mb-3 tracking-wider">
            EMAIL
          </Text>
          <TextInput
            placeholder="hello@example.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (error) clearError();
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            className="w-full bg-card dark:bg-card-dark px-4 py-4 text-foreground dark:text-foreground-dark text-base rounded-xl"
            editable={!loading}
          />
        </View>

        {error ? (
          <View className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3">
            <Text className="text-rose-500 text-sm">{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!email || loading}
          className={`w-full rounded-full py-4 items-center flex-row justify-center ${
            !email || loading ? 'bg-muted dark:bg-muted-dark' : 'bg-primary dark:bg-primary-dark'
          }`}
        >
          <Text
            className={`font-semibold text-lg mr-2 ${
              !email || loading
                ? 'text-muted-foreground dark:text-muted-foreground-dark'
                : 'text-primary-foreground dark:text-primary-foreground-dark'
            }`}
          >
            {loading ? 'SENDING...' : 'Send reset link'}
          </Text>
          {!loading && (
            <ArrowRight
              size={20}
              className={
                !email
                  ? 'text-muted-foreground dark:text-muted-foreground-dark'
                  : 'text-primary-foreground dark:text-primary-foreground-dark'
              }
            />
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
