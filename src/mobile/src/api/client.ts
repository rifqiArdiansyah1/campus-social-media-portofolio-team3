import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import { getStoredToken, removeStoredToken, removeStoredUser } from '../utils/storage';

const DEFAULT_LOCAL_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8000/api/v1'
    : 'http://localhost:8000/api/v1';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || DEFAULT_LOCAL_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

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
    }

    return Promise.reject(error);
  }
);
