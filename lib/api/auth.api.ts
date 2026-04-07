import apiClient, { TOKEN_KEY } from './client';
import * as SecureStore from 'expo-secure-store';

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

  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get('/api/auth/me');
    return data.data;
  },

  // Token helpers
  saveToken: (token: string) =>
    SecureStore.setItemAsync(TOKEN_KEY, token),

  clearToken: () =>
    SecureStore.deleteItemAsync(TOKEN_KEY),

  getToken: () =>
    SecureStore.getItemAsync(TOKEN_KEY),
};