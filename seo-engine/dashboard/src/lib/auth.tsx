"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  setAuthToken,
  getAuthToken,
  setOnUnauthorized,
  login as apiLogin,
  verify as apiVerify,
} from "./api";

interface User {
  id: string;
  email: string;
}

interface Subscription {
  plan: string;
  status: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  subscription: Subscription | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    subscription: null,
    loading: true,
  });

  const logout = useCallback(() => {
    setAuthToken(null);
    try { sessionStorage.removeItem("chainiq_token"); } catch {}
    setState({ user: null, subscription: null, loading: false });
    router.push("/login");
  }, [router]);

  // Set up 401 handler
  useEffect(() => {
    setOnUnauthorized(logout);
  }, [logout]);

  // Restore session on mount — check in-memory token or sessionStorage
  useEffect(() => {
    let cancelled = false;
    const inMemory = getAuthToken();
    const stored = (() => { try { return sessionStorage.getItem("chainiq_token"); } catch { return null; } })();
    const token = inMemory || stored;

    if (token) {
      if (!inMemory) setAuthToken(token);
      apiVerify()
        .then((data) => {
          if (!cancelled && data.status === "ok") {
            setState({
              user: data.user,
              subscription: data.subscription,
              loading: false,
            });
          } else if (!cancelled) {
            setAuthToken(null);
            try { sessionStorage.removeItem("chainiq_token"); } catch {}
            setState((s) => ({ ...s, loading: false }));
          }
        })
        .catch(() => {
          if (!cancelled) {
            setAuthToken(null);
            try { sessionStorage.removeItem("chainiq_token"); } catch {}
            setState((s) => ({ ...s, loading: false }));
          }
        });
    } else {
      setState((s) => ({ ...s, loading: false }));
    }
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiLogin(email, password);
      setAuthToken(data.access_token);
      try { sessionStorage.setItem("chainiq_token", data.access_token); } catch {}
      setState({
        user: data.user,
        subscription: data.subscription,
        loading: false,
      });
      router.push("/");
    },
    [router]
  );

  const isAdmin = state.subscription?.role === "admin";

  return (
    <AuthContext.Provider value={{ ...state, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
