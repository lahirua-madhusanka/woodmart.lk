import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  loginApi,
  logoutApi,
  profileApi,
  registerApi,
} from "../services/authService";
import { getApiErrorMessage } from "../services/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("authToken") || "");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await profileApi();
        setUser(response.user);
      } catch (error) {
        localStorage.removeItem("authToken");
        setToken("");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [token]);

  const register = async (payload) => {
    try {
      const response = await registerApi(payload);
      localStorage.setItem("authToken", response.token);
      setToken(response.token);
      setUser(response.user);
      toast.success("Registration successful");
      return response.user;
    } catch (error) {
      const message = getApiErrorMessage(error);
      toast.error(message);
      throw error;
    }
  };

  const login = async (payload) => {
    try {
      const response = await loginApi(payload);
      localStorage.setItem("authToken", response.token);
      setToken(response.token);
      setUser(response.user);
      toast.success("Login successful");
      return response.user;
    } catch (error) {
      const message = getApiErrorMessage(error);
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore logout API failures during local cleanup.
    }
    localStorage.removeItem("authToken");
    setToken("");
    setUser(null);
    toast.info("Logged out");
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      register,
      login,
      logout,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
