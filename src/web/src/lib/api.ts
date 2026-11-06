import axios, { AxiosError } from "axios";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Standardized API Error contract matching Backend AppError & FastAPI Validation
 */
export interface AppErrorDetail {
  loc?: (string | number)[];
  msg?: string;
  type?: string;
}

export interface AppErrorResponse {
  detail: string;
  code?: string;
  errors?: AppErrorDetail[];
}

type UnauthorizedCallback = () => void;
const unauthorizedCallbacks: UnauthorizedCallback[] = [];

/**
 * Register a callback to be executed when a 401 Unauthorized response is encountered
 * e.g., to clear react-query cache and reset user session.
 */
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

// Request interceptor to automatically attach JWT token for authenticated requests
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("campusfolio_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to format error message from backend contract & handle session expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<AppErrorResponse>) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("campusfolio_token");
        localStorage.removeItem("campusfolio_user");
      }
      triggerUnauthorized();
    }
    if (error.response?.data?.detail) {
      error.message = error.response.data.detail;
    }
    return Promise.reject(error);
  }
);
