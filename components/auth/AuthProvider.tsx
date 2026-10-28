"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type User = {
  id: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  emailVerified: Date | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  preferredLocale: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Centralized authentication provider.
 *
 * Fetches the session from /api/auth/me on mount and re-fetches whenever
 * a `joud:session-changed` event is dispatched (login, register, logout,
 * profile update). Provides a stable `isLoading` state so auth-dependent
 * UI never flashes login/register buttons before the session is restored.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        if (!response.ok) {
          if (!cancelled) setUser(null);
          return;
        }

        const payload = (await response.json()) as {
          success: boolean;
          data: User | null;
        };

        if (!cancelled) {
          setUser(payload.success ? payload.data : null);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadUser();

    function onSessionChanged() {
      loadUser();
    }

    window.addEventListener("joud:session-changed", onSessionChanged);

    return () => {
      cancelled = true;
      window.removeEventListener("joud:session-changed", onSessionChanged);
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore logout errors — clear local state regardless.
    }

    setUser(null);
    setIsLoading(false);
    window.dispatchEvent(new CustomEvent("joud:session-changed"));
    window.location.href = "/";
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      logout,
    }),
    [user, isLoading, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to consume the authenticated user and logout function.
 * Must be used within an AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
