"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  UserProfile,
  TokenResponse,
  LoginPayload,
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  getAuthToken,
  getStoredUser,
  setAuthSession,
  clearAuthSession,
  loginUser as apiLoginUser,
  fetchCurrentUser as apiFetchCurrentUser,
} from "@/lib/auth";
import { registerOnUnauthorized } from "@/lib/api";

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<TokenResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  onClearCache?: () => void;
}

export function AuthProvider({ children, onClearCache }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    clearAuthSession();
    setUser(null);
    setToken(null);
    if (onClearCache) {
      onClearCache();
    }
  }, [onClearCache]);

  const verifyCurrentUser = useCallback(async () => {
    try {
      const freshUser = await apiFetchCurrentUser();
      setUser(freshUser);
    } catch {
      logout();
    }
  }, [logout]);

  // Sync session on mount & multi-tab storage events
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const storedToken = getAuthToken();
      if (!storedToken) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      setToken(storedToken);
      const cachedUser = getStoredUser();
      if (cachedUser) {
        setUser(cachedUser);
      }

      try {
        const freshUser = await apiFetchCurrentUser();
        if (isMounted) {
          setUser(freshUser);
        }
      } catch {
        if (isMounted) {
          logout();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    // Listen for multi-tab logout/login events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === AUTH_TOKEN_KEY) {
        if (!e.newValue) {
          // Logged out in another tab
          setUser(null);
          setToken(null);
          if (onClearCache) onClearCache();
        } else {
          // Logged in from another tab
          setToken(e.newValue);
          const cached = getStoredUser();
          if (cached) setUser(cached);
          verifyCurrentUser();
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);
    }

    // Listen for 401 Unauthorized from apiClient
    const unregister = registerOnUnauthorized(() => {
      logout();
    });

    return () => {
      isMounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorageChange);
      }
      unregister();
    };
  }, [logout, onClearCache, verifyCurrentUser]);

  const login = useCallback(
    async (payload: LoginPayload): Promise<TokenResponse> => {
      setIsLoading(true);
      try {
        const data = await apiLoginUser(payload);
        setToken(data.access_token);
        setUser(data.user);
        return data;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const refreshUser = useCallback(async () => {
    await verifyCurrentUser();
  }, [verifyCurrentUser]);

  const value: AuthContextValue = {
    user,
    token,
    role: user?.role ?? null,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
