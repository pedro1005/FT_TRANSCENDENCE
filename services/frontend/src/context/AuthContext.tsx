//services/frontend/src/context/AuthContext.tsx
"use client";

import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import axios from "axios";

interface AuthUser {
  id: string;
  email: string;
  role: string;
  username: string;
}

interface AuthContextProps {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (_jwt?: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hydrateAuth = useCallback(async () => {
    try {
      const { data } = await axios.get<AuthUser>("/api/users/me");
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void hydrateAuth();
  }, [hydrateAuth]);

  const login = useCallback(async (_jwt?: string) => {
    setIsLoading(true);
    await hydrateAuth();
  }, [hydrateAuth]);

  const logout = useCallback(async () => {
    try {
      await axios.post("/api/auth/logout");
    } catch {
      // Keep going even if logout cannot reach the backend.
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};