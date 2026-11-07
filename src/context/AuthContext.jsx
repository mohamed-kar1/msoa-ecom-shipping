
import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import { authService } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const currentUser = await authService.getCurrentUser();

        if (active) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Session restoration failed:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const login = async (email, password) => {
    const session = await authService.login(email, password);
    setUser(session.user);
    return session;
  };

  const register = async (name, email, password) => {
    return authService.register(name, email, password);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider."
    );
  }

  return context;
}
