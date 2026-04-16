import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_PROD_URL = 'https://proxi-api-production.up.railway.app';
const USE_LOCAL_API = process.env.EXPO_PUBLIC_USE_LOCAL_API === 'true';

function getExpoHost() {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;

  const host = hostUri.split(':')[0];
  if (!host) return null;
  if (host === 'localhost' || host === '127.0.0.1') return null;

  return host;
}

function resolveBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configuredUrl) return configuredUrl;

  if (!__DEV__) return DEFAULT_PROD_URL;

  // In Expo Go, auto-detecting a local API host often points to a non-API service,
  // which surfaces as 404 "Not found" during auth calls.
  if (!USE_LOCAL_API) return DEFAULT_PROD_URL;

  const expoHost = getExpoHost();
  if (expoHost) return `http://${expoHost}:8080`;

  if (Platform.OS === 'android') return 'http://10.0.2.2:8080';

  return 'http://localhost:8080';
}

const BASE_URL = resolveBaseUrl();

export const TOKEN_KEY = 'proxi_jwt_token';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach JWT to every request ──
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 globally ──
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired — clear storage, app will redirect to login
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);

export default apiClient;