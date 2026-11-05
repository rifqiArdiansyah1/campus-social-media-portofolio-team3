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
      const code = error.response.data?.code;
      if (code === "TOKEN_EXPIRED" || code === "INVALID_TOKEN") {
        if (typeof window !== "undefined") {
          localStorage.removeItem("campusfolio_token");
          localStorage.removeItem("campusfolio_user");
          document.cookie = "campusfolio_token=; path=/; max-age=0; SameSite=Lax";
        }
      }
    }
    if (error.response?.data?.detail) {
      error.message = error.response.data.detail;
    }
    return Promise.reject(error);
  }
);

export interface CandidateProfile {
  user_id: string;
  name: string;
  department: string;
  bio: string;
  skills: string[];
  interests: string[];
}

export interface RecommendationQuery {
  query_user_id: string;
  target_skills?: string[];
  project_description?: string;
  top_k?: number;
}

export const fetchRecommendations = async (query: RecommendationQuery) => {
  const response = await apiClient.post("/recommendations/match", query);
  return response.data;
};

export const checkModeration = async (postId: string, content: string) => {
  const response = await apiClient.post("/moderation/check", {
    post_id: postId,
    content: content,
  });
  return response.data;
};
