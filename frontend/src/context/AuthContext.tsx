import React, { createContext, useContext, useState, useEffect } from 'react';
import { CurrentUser, LoginResponse } from '../types/auth';

interface AuthContextType {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrCode: string, password: string, rememberMe: boolean) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: (idToken: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  currentDashboard: string;
  setCurrentDashboard: (route: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'soms_access_token';
const REFRESH_KEY = 'soms_refresh_token';
const USER_KEY = 'soms_user_profile';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CurrentUser | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentDashboard, setCurrentDashboard] = useState<string>(() => {
    return user?.defaultDashboard || '/login';
  });

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.ok) {
          const freshUser: CurrentUser = await res.json();
          setUser(freshUser);
          localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
          setCurrentDashboard(freshUser.defaultDashboard);
        } else if (res.status === 401) {
          // Attempt refresh
          const refreshToken = localStorage.getItem(REFRESH_KEY);
          if (refreshToken) {
            const refreshRes = await fetch('/api/auth/refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            });

            if (refreshRes.ok) {
              const data: LoginResponse = await refreshRes.json();
              localStorage.setItem(TOKEN_KEY, data.accessToken);
              localStorage.setItem(REFRESH_KEY, data.refreshToken);
              localStorage.setItem(USER_KEY, JSON.stringify(data.user));
              setUser(data.user);
              setCurrentDashboard(data.user.defaultDashboard);
            } else {
              handleLogoutCleanup();
            }
          } else {
            handleLogoutCleanup();
          }
        }
      } catch {
        // Network or server offline; keep local session if valid
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogoutCleanup = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setCurrentDashboard('/login');
    if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
      window.history.pushState(null, '', '/login');
    }
  };

  const login = async (emailOrCode: string, password: string, rememberMe: boolean) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrCode, password, rememberMe })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.message || 'Email hoặc mật khẩu không chính xác.'
        };
      }

      const data: LoginResponse = await res.json();
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      localStorage.setItem(REFRESH_KEY, data.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      setUser(data.user);
      const targetDashboard = data.user.defaultDashboard || '/admin/dashboard';
      setCurrentDashboard(targetDashboard);
      if (window.location.pathname !== targetDashboard) {
        window.history.pushState(null, '', targetDashboard);
      }

      return { success: true };
    } catch {
      return {
        success: false,
        message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.'
      };
    }
  };

  const loginWithGoogle = async (idToken: string) => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.message || 'Xác thực Google không thành công.'
        };
      }

      const data: LoginResponse = await res.json();
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      localStorage.setItem(REFRESH_KEY, data.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      setUser(data.user);
      setCurrentDashboard(data.user.defaultDashboard);

      return { success: true };
    } catch {
      return {
        success: false,
        message: 'Không thể kết nối đến máy chủ để xác thực Google.'
      };
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (refreshToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
      } catch {
        // Ignore network errors on logout
      }
    }
    handleLogoutCleanup();
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  const hasRole = (role: string) => {
    if (!user) return false;
    return user.roles.map(r => r.toLowerCase()).includes(role.toLowerCase());
  };

  const updateDashboardRoute = (route: string) => {
    setCurrentDashboard(route);
    if (window.location.pathname !== route) {
      window.history.pushState(null, '', route);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        logout,
        hasPermission,
        hasRole,
        currentDashboard,
        setCurrentDashboard: updateDashboardRoute
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const usePermission = (permission: string): boolean => {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
};
