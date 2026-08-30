import apiClient, { TOKEN_KEY } from './client';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = 'proxi_user';

// Call this after every successful login/signup
export async function saveUser(user: User): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Used on app launch when offline
export async function getStoredUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

// Clear on logout
export async function clearUser(): Promise<void> {
  await AsyncStorage.removeItem(USER_KEY);
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResult {
  token: string;
  user: User;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export const authApi = {
  signup: async (payload: SignupPayload): Promise<AuthResult> => {
    const { data } = await apiClient.post('/api/auth/signup', payload);
    return data.data;
  },

  login: async (payload: LoginPayload): Promise<AuthResult> => {
    const { data } = await apiClient.post('/api/auth/login', payload);
    return data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/api/auth/logout');
  },

  forgotPassword: async (payload: ForgotPasswordPayload): Promise<void> => {
    await apiClient.post('/api/auth/forgot-password', payload);
  },

  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get('/api/auth/me');
    return data.data;
  },

  // Required by Apple guideline 5.1.1(v). The endpoint must delete the account
  // and everything it owns, not deactivate it.
  deleteAccount: async (): Promise<void> => {
    await apiClient.delete('/api/auth/me');
  },

  // Token helpers
  saveToken: (token: string) =>
    SecureStore.setItemAsync(TOKEN_KEY, token),

  clearToken: () =>
    SecureStore.deleteItemAsync(TOKEN_KEY),

  getToken: () =>
    SecureStore.getItemAsync(TOKEN_KEY),

  saveUser,

  getStoredUser,

  clearUser,
};