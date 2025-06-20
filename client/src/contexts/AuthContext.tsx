import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/check-auth`, {
        method: "GET",
        credentials: "include", // Include cookies for session
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          setError(null);
        } else {
          setUser(null);
          setError(null);
        }
      } else if (response.status === 401) {
        // 401 is expected when user is not authenticated - not an error
        setUser(null);
        setError(null);
      } else {
        // Other errors (500, etc.) are actual problems
        setUser(null);
        setError("Failed to check authentication status");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
      setError("Failed to check authentication status");
    } finally {
      setIsLoading(false);
    }
  };
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for session
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
        setError(null);
        return { success: true };
      } else {
        setError(data.message || "Login failed");
        return { success: false, message: data.message || "Login failed" };
      }
    } catch (error) {
      console.error("Login failed:", error);
      const errorMessage = "Server error. Please try again.";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };
  const logout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/logout`, {
        method: "GET",
        credentials: "include", // Include cookies for session
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      setError(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);
  const value = {
    user,
    isLoading,
    error,
    login,
    logout,
    checkAuth,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
