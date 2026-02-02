
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, Href } from 'expo-router';

type User = {
  id: string;
  email: string;
  name: string;
};

type AuthContextType = {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('@proxi_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
          setIsLoggedIn(true);
          router.replace('/(tab)/home' as Href);
        } else {
          router.replace('/(auth)' as Href);
        }
      } catch (e) {
        console.log('[v0] Failed to restore session:', e);
        router.replace('/(auth)' as Href);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, [router]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        name: email.split('@')[0],
      };
      setUser(newUser);
      setIsLoggedIn(true);
      await AsyncStorage.setItem('@proxi_user', JSON.stringify(newUser));
      router.replace('/(tab)/home' as Href);
    } catch (error) {
      console.log('[v0] Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        name,
      };
      setUser(newUser);
      setIsLoggedIn(true);
      await AsyncStorage.setItem('@proxi_user', JSON.stringify(newUser));
      router.replace('/(tab)/home' as Href);
    } catch (error) {
      console.log('[v0] Signup error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      setIsLoggedIn(false);
      await AsyncStorage.removeItem('@proxi_user');
      router.replace('/(auth)' as Href);
    } catch (error) {
      console.log('[v0] Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isLoading,
        user,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
