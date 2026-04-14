import React, { createContext, useContext, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { authApi, User } from '@/lib/api';
import { getApiError } from '@/lib/api/errors';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]         = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true); // true on mount while checking token
  const [error, setError]       = useState<string | null>(null);

  // On app start — check if a valid token exists and fetch user profile
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = await authApi.getToken();
        if (token) {
          const me = await authApi.getMe();
          setUser(me);
        }
      } catch {
        // Token invalid/expired — clear it
        await authApi.clearToken();
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const result = await authApi.login({ email, password });
      await authApi.saveToken(result.token);
      setUser(result.user);
      router.replace('/(tab)/home');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const result = await authApi.signup({ name, email, password });
      await authApi.saveToken(result.token);
      setUser(result.user);
      router.replace('/(tab)/home');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout API errors — always clear locally
    } finally {
      await authApi.clearToken();
      setUser(null);
      router.replace('/(auth)/login');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      signup,
      logout,
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