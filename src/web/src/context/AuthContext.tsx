"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  UserProfile,
  TokenResponse,
  LoginPayload,
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

  // Sync session on mount
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
        // If token is invalid or expired
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

    // Listen for 401 Unauthorized from apiClient
    const unregister = registerOnUnauthorized(() => {
      logout();
    });

    return () => {
      isMounted = false;
      unregister();
    };
  }, [logout]);

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
    try {
      const freshUser = await apiFetchCurrentUser();
      setUser(freshUser);
    } catch {
      logout();
    }
  }, [logout]);

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
