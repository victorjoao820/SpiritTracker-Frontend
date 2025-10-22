import React, { useState, useEffect, createContext, useCallback } from 'react';
import { authAPI, usersAPI } from '../services/api.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    authAPI.removeTokens();
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  const checkAuth = useCallback(async () => {
    // Check if user has any tokens (access or refresh)
    const hasAccessToken = authAPI.isAuthenticated();
    const hasRefreshToken = !!localStorage.getItem('refreshToken');
    
    if (!hasAccessToken && !hasRefreshToken) {
      // No tokens at all - user is not authenticated
      setIsAuthenticated(false);
      setUser(null);
      return;
    }
    
    // User has tokens, try to validate/refresh
    try {
      const response = await usersAPI.getProfile();
      setIsAuthenticated(true);
      
      // If validation passes but no user data, fetch it
      if (response && response.user && !user) {
        setUser(response.user);
      }
    } catch (error) {
      console.error('Auth validation failed:', error);
      // Only clear auth state if refresh token is also invalid
      setIsAuthenticated(false);
      setUser(null);
    }
  }, [user]);

  useEffect(() => {
    // Initial auth check on mount
    const initializeAuth = async () => {
      await checkAuth();
      setIsLoading(false);
    };
    
    initializeAuth();
  }, [checkAuth]);

  const login = useCallback(async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      authAPI.setTokens(response.tokens.accessToken, response.tokens.refreshToken);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  const register = useCallback(async (email, password) => {
    try {
      const response = await authAPI.register(email, password);
      authAPI.setTokens(response.tokens.accessToken, response.tokens.refreshToken);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }, []);

  const value = {
    isAuthenticated,
    isLoading,
    user,
    setIsAuthenticated,
    setUser,
    checkAuth,
    logout,
    login,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
