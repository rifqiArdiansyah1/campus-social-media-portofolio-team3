import { apiClient } from "./api";

export interface UserProfile {
  user_id: number;
  id: number;
  nim?: string | null;
  nama: string;
  email: string;
  role: "mahasiswa" | "moderator" | "admin" | string;
  jurusan?: string | null;
  angkatan?: number | null;
  bio?: string | null;
  kontak_url?: string | null;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: UserProfile;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  nim: string;
  nama: string;
  email: string;
  password: string;
  jurusan: string;
  angkatan: number;
}

export const AUTH_TOKEN_KEY = "campusfolio_token";
export const AUTH_USER_KEY = "campusfolio_user";

export function setAuthSession(token: string, user: UserProfile): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return null;
}

export function getStoredUser(): UserProfile | null {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(AUTH_USER_KEY);
    if (data) {
      try {
        return JSON.parse(data) as UserProfile;
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function clearAuthSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

export async function loginUser(payload: LoginPayload): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>("/auth/login", payload);
  setAuthSession(response.data.access_token, response.data.user);
  return response.data;
}

export async function registerUser(payload: RegisterPayload): Promise<UserProfile> {
  const response = await apiClient.post<UserProfile>("/auth/register", payload);
  return response.data;
}

export async function fetchCurrentUser(): Promise<UserProfile> {
  const response = await apiClient.get<UserProfile>("/auth/me");
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.data));
  }
  return response.data;
}

export async function logoutUser(): Promise<void> {
  try {
    await apiClient.post("/auth/logout");
  } finally {
    clearAuthSession();
  }
}
