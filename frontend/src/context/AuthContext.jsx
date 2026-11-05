
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  registerUser,
  loginUser,
  getCurrentUser,
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("stayscape_token"));
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const response = await getCurrentUser(token);
        setUser(response.user);
      } catch (error) {
        console.error("Unable to restore login session:", error);
        localStorage.removeItem("stayscape_token");
        setToken(null);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    restoreSession();
  }, [token]);

  const register = async (userData) => {
    const response = await registerUser(userData);

    localStorage.setItem("stayscape_token", response.token);
    setToken(response.token);
    setUser(response.user);

    return response;
  };

  const login = async (credentials) => {
    const response = await loginUser(credentials);

    localStorage.setItem("stayscape_token", response.token);
    setToken(response.token);
    setUser(response.user);

    return response;
  };

  const logout = () => {
    localStorage.removeItem("stayscape_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        authLoading,
        isAuthenticated: Boolean(user && token),
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
