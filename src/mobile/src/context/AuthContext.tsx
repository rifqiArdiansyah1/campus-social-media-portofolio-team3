import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient, registerOnUnauthorized } from '../api/client';
import {
  UserProfileResponse,
  MyProfileResponse,
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  UserRole,
} from '../api/types';
import {
  getStoredToken,
  setStoredToken,
  removeStoredToken,
  getStoredUser,
  setStoredUser,
  removeStoredUser,
} from '../utils/storage';

export type AuthUser = UserProfileResponse | MyProfileResponse;

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  role: UserRole | string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<TokenResponse>;
  register: (payload: RegisterRequest) => Promise<TokenResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(async () => {
    await removeStoredToken();
    await removeStoredUser();
    setToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiClient.get<MyProfileResponse>('/auth/me');
      setUser(res.data);
      await setStoredUser(res.data);
    } catch {
      await logout();
    }
  }, [logout]);

  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const storedToken = await getStoredToken();
        const storedUser = await getStoredUser<AuthUser>();

        if (!storedToken) {
          if (isMounted) setIsLoading(false);
          return;
        }

        if (isMounted) {
          setToken(storedToken);
          if (storedUser) setUser(storedUser);
        }

        const res = await apiClient.get<MyProfileResponse>('/auth/me');
        if (isMounted) {
          setUser(res.data);
          await setStoredUser(res.data);
        }
      } catch {
        if (isMounted) {
          await logout();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    const unsubscribe = registerOnUnauthorized(() => {
      if (isMounted) {
        setUser(null);
        setToken(null);
        queryClient.clear();
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [logout]);

  const login = async (payload: LoginRequest): Promise<TokenResponse> => {
    const res = await apiClient.post<TokenResponse>('/auth/login', payload);
    const data = res.data;
    await setStoredToken(data.access_token);
    await setStoredUser(data.user);
    setToken(data.access_token);
    setUser(data.user);
    return data;
  };

  const register = async (payload: RegisterRequest): Promise<TokenResponse> => {
    const res = await apiClient.post<TokenResponse>('/auth/register', payload);
    const data = res.data;
    await setStoredToken(data.access_token);
    await setStoredUser(data.user);
    setToken(data.access_token);
    setUser(data.user);
    return data;
  };

  const role = user?.role || null;
  const isAuthenticated = Boolean(token && user);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
