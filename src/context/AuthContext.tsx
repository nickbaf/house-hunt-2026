import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { initOctokit, validateToken } from "@/api/github";
import { decryptToken } from "@/auth/decrypt";

interface AuthState {
  token: string;
  username: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  username: string;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "house-hunt-auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }

    try {
      const parsed: AuthState = JSON.parse(stored);
      validateToken(parsed.token).then((valid) => {
        if (valid) {
          initOctokit(parsed.token);
          setAuth(parsed);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
        setIsLoading(false);
      });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (username: string, password: string): Promise<string | null> => {
      const token = await decryptToken(username, password);
      if (!token) return "Invalid username or password.";

      const valid = await validateToken(token);
      if (!valid) return "Authentication failed. The token may have expired.";

      const state: AuthState = { token, username };
      initOctokit(token);
      setAuth(state);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return null;
    },
    [],
  );

  const logout = useCallback(() => {
    setAuth(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!auth,
        username: auth?.username ?? "",
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
