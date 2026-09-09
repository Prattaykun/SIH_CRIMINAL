"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import {
  getStoredToken,
  setStoredToken,
  getStoredUser,
  setStoredUser,
  clearAuth,
  subscribeToAuthSync,
} from '@/lib/auth';

type Role = 'ADMINISTRATOR' | 'INVESTIGATOR' | 'ANALYST' | 'REVIEWER';

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isInitialized: boolean;
  loginSplashPending: boolean;
  login: (token: string, user: User) => void;
  completeLoginSplash: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Keep token in memory outside React state as well to inject into API calls
let memoryToken: string | null = typeof window !== 'undefined' ? getStoredToken() : null;

export const setMemoryToken = (token: string | null) => {
  memoryToken = token;
};

export const getMemoryToken = () => {
  return memoryToken || (typeof window !== 'undefined' ? getStoredToken() : null);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loginSplashPending, setLoginSplashPending] = useState(false);
  const router = useRouter();

  // Rehydrate on mount and listen to cross-device/tab storage events
  useEffect(() => {
    const storedToken = getStoredToken();
    const storedUser = getStoredUser<User>();

    if (storedToken) {
      setToken(storedToken);
      setMemoryToken(storedToken);
    }
    if (storedUser) {
      setUser(storedUser);
    }
    setIsInitialized(true);

    // Cross-tab synchronization
    const unsubscribeSync = subscribeToAuthSync((syncedToken, syncedUser) => {
      setToken(syncedToken);
      setMemoryToken(syncedToken);
      setUser(syncedUser as User | null);
    });

    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
      setMemoryToken(null);
      clearAuth();
      setLoginSplashPending(false);
    };

    window.addEventListener('unauthorized', handleUnauthorized);

    return () => {
      unsubscribeSync();
      window.removeEventListener('unauthorized', handleUnauthorized);
    };
  }, []);

  const login = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    setMemoryToken(newToken);
    setStoredToken(newToken);
    setStoredUser(newUser);
    setLoginSplashPending(true);
  }, []);

  const completeLoginSplash = useCallback(() => {
    setLoginSplashPending(false);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setMemoryToken(null);
    clearAuth();
    setLoginSplashPending(false);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isInitialized,
        loginSplashPending,
        login,
        completeLoginSplash,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
