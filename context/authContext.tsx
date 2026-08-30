import React, { createContext, useContext, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, User } from '@/lib/api';
import { setUnauthorizedHandler } from '@/lib/api/client';
import { getApiError } from '@/lib/api/errors';
import { stopGeofencing } from '@/lib/location/geofencing';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<boolean>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]         = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true); // true on mount while checking token
  const [error, setError]       = useState<string | null>(null);

  // Everything account-scoped, wiped in one place so logout and deletion
  // cannot drift apart. The theme lives under '@proxi_theme' and is a device
  // preference, not account data, so it deliberately survives.
  const clearLocalSession = async () => {
    await authApi.clearToken();
    await authApi.clearUser();
    try {
      const keys = await AsyncStorage.getAllKeys();
      const owned = keys.filter(k => k.startsWith('proxi_'));
      if (owned.length) await AsyncStorage.multiRemove(owned);
    } catch {
      // Non-critical — the token is already gone, so the session is over.
    }
    await stopGeofencing().catch(() => {});
  };

  // A 401 from any request means the session is over. Clearing the user is
  // enough to route: RootNavigator redirects on !isAuthenticated.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void authApi.clearUser();
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // On app start — check if a valid token exists and fetch user profile
 useEffect(() => {
  const bootstrap = async () => {
    try {
      const token = await authApi.getToken();
      const storedUser = await authApi.getStoredUser();

      if (storedUser) {
        // Keep users signed in immediately between app launches.
        setUser(storedUser);
      }

      if (!token) {
        // Never logged in or explicitly logged out
        if (!storedUser) {
          setUser(null);
        }
        setLoading(false);
        return;
      }

      // Token exists — refresh profile in background.
      try {
        const me = await authApi.getMe();
        await authApi.saveUser(me);
        setUser(me);
      } catch (err) {
        // Only force logout when backend confirms token is invalid.
        if (err instanceof AxiosError && err.response?.status === 401) {
          await authApi.clearToken();
          await authApi.clearUser();
          setUser(null);
        }
      }
    } catch {
      // Keep cached session on transient storage/network failures.
    } finally {
      setLoading(false);
    }
  };

  bootstrap();
}, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const result = await authApi.login({ email, password });
      await authApi.saveToken(result.token);
      await authApi.saveUser(result.user);
      setUser(result.user);
      return true;
    } catch (err) {
      setError(getApiError(err));
      return false;
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setError(null);
    try {
      const result = await authApi.signup({ name, email, password });
      await authApi.saveToken(result.token);
      await authApi.saveUser(result.user);
      setUser(result.user);
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const forgotPassword = async (email: string) => {
    setError(null);
    try {
      await authApi.forgotPassword({ email });
      return true;
    } catch (err) {
      setError(getApiError(err));
      return false;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout API errors — always clear locally
    } finally {
      await clearLocalSession();
      setUser(null);
      router.replace('/(auth)/login');
    }
  };

  // Apple guideline 5.1.1(v). Unlike logout, this only tears down locally once
  // the server confirms the account is gone — a failed delete must not look
  // like it succeeded.
  const deleteAccount = async (): Promise<boolean> => {
    setError(null);
    try {
      await authApi.deleteAccount();
    } catch (err) {
      setError(getApiError(err));
      return false;
    }

    await clearLocalSession();
    setUser(null);
    router.replace('/(auth)/login');
    return true;
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      signup,
      forgotPassword,
      logout,
      deleteAccount,
      error,
      clearError: () => setError(null),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}