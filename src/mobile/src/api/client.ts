import axios, { AxiosError } from 'axios';
import { NativeModules, Platform } from 'react-native';
import { getStoredToken, removeStoredToken, removeStoredUser } from '../utils/storage';

export function resolveDefaultBaseUrl(): string {
  // 1. If explicit env variable is set and not localhost/127.0.0.1, use it
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // 2. In Expo Go development mode, auto-detect the Metro host IP from NativeModules
  const scriptURL = NativeModules?.SourceCode?.scriptURL;
  if (scriptURL) {
    const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
    if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
      return `http://${match[1]}:8000/api/v1`;
    }
  }

  // 3. Fallback for emulator / simulator
  return Platform.OS === 'android'
    ? 'http://10.0.2.2:8000/api/v1'
    : 'http://localhost:8000/api/v1';
}

export let API_BASE_URL = resolveDefaultBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export function updateApiBaseUrl(newUrl: string): void {
  API_BASE_URL = newUrl;
  apiClient.defaults.baseURL = newUrl;
}

export interface AppErrorDetail {
  loc?: (string | number)[];
  msg?: string;
  type?: string;
}

export interface AppErrorResponse {
  detail: string | AppErrorDetail[];
  code?: string;
  errors?: AppErrorDetail[];
}

type UnauthorizedCallback = () => void;
const unauthorizedCallbacks: UnauthorizedCallback[] = [];

export function registerOnUnauthorized(callback: UnauthorizedCallback): () => void {
  unauthorizedCallbacks.push(callback);
  return () => {
    const index = unauthorizedCallbacks.indexOf(callback);
    if (index !== -1) {
      unauthorizedCallbacks.splice(index, 1);
    }
  };
}

function triggerUnauthorized(): void {
  for (const cb of unauthorizedCallbacks) {
    try {
      cb();
    } catch {
      // ignore callback error
    }
  }
}

// Interceptor: inject JWT Bearer token
apiClient.interceptors.request.use(async (config) => {
  const token = await getStoredToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: handle 401 and sanitize backend error messages
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<AppErrorResponse>) => {
    if (error.response?.status === 401) {
      await removeStoredToken();
      await removeStoredUser();
      triggerUnauthorized();
    }

    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') {
      error.message = detail;
    } else if (Array.isArray(detail)) {
      error.message = detail
        .map((d: any) => d.msg || JSON.stringify(d))
        .filter(Boolean)
        .join(', ');
    } else if (error.message === 'Network Error' || !error.response) {
      const targetUrl = error.config?.baseURL || apiClient.defaults.baseURL || API_BASE_URL;
      error.message = `Gagal terhubung ke backend (${targetUrl}). Periksa apakah backend aktif dan Windows Firewall mengizinkan port 8000.`;
    }

    return Promise.reject(error);
  }
);
