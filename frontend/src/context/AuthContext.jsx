import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      if (token) {
        try {
          const res = await authService.getMe();
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
          }
        } catch (err) {
          console.warn('Session verification failed, logging out', err);
          setUser(null);
          setToken(null);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };

    verifySession();
  }, [token]);

  const login = async (credentials) => {
    setIsLoading(true);
    try {
      const res = await authService.login(credentials);
      if (res.success && res.data) {
        const { user: loggedInUser, accessToken } = res.data;
        setUser(loggedInUser);
        setToken(accessToken);
        localStorage.setItem('user', JSON.stringify(loggedInUser));
        localStorage.setItem('token', accessToken);
        return { success: true };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Invalid username or password',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setIsLoading(false);
    }
  };

  const hasRole = (roles) => {
    if (!user || !user.role) return false;
    if (user.role.name === 'SUPER_ADMIN') return true;
    const allowed = Array.isArray(roles) ? roles : [roles];
    return allowed.includes(user.role.name);
  };

  const hasPermission = (permissionCode) => {
    if (!user || !user.role) return false;
    if (user.role.name === 'SUPER_ADMIN') return true;

    const permissions = user.role.permissions || [];
    return permissions.some(
      (perm) => perm.code === permissionCode || perm.code === '*:*'
    );
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    hasRole,
    hasPermission,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
