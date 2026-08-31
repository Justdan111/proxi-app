import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_PROD_URL = 'https://proxi-api-production.up.railway.app';
const LOCAL_API_PORT = 8080;
const USE_LOCAL_API = process.env.EXPO_PUBLIC_USE_LOCAL_API === 'true';

function getExpoHost() {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;

  const host = hostUri.split(':')[0];
  if (!host) return null;
  if (host === 'localhost' || host === '127.0.0.1') return null;

  return host;
}

// The dev machine hosts both Metro and the local API, so Metro's host is the
// API's host too — that is what makes a physical device reach it over the LAN.
function resolveLocalUrl() {
  const expoHost = getExpoHost();
  if (expoHost) return `http://${expoHost}:${LOCAL_API_PORT}`;

  if (Platform.OS === 'android') return `http://10.0.2.2:${LOCAL_API_PORT}`;

  return `http://localhost:${LOCAL_API_PORT}`;
}

function resolveBaseUrl() {
  // Checked before EXPO_PUBLIC_API_URL: `.env` ships the production URL, so the
  // opposite order leaves the flag unreachable and every local run hits Railway.
  // In Expo Go, auto-detecting a local API host often points to a non-API service,
  // which surfaces as 404 "Not found" during auth calls — hence the explicit flag.
  if (__DEV__ && USE_LOCAL_API) return resolveLocalUrl();

  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configuredUrl) return configuredUrl;

  return DEFAULT_PROD_URL;
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

// Registered by authContext on mount. Without it a 401 cleared the token but
// left the user sitting on a screen whose data would never load.
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

// ── Response interceptor: handle 401 globally ──
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired — clear storage, app will redirect to login
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export default apiClient;