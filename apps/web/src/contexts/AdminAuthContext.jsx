import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiServerClient from '@/lib/apiServerClient.js';

const AdminAuthContext = createContext(null);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Restore session from localStorage on mount
  useEffect(() => {
    console.log('[AdminAuthContext] Initializing from localStorage...');
    const storedToken = localStorage.getItem('adminAuthToken');
    const storedUserStr = localStorage.getItem('adminUser');

    if (storedToken && storedUserStr) {
      try {
        const storedUser = JSON.parse(storedUserStr);
        setAuthToken(storedToken);
        setCurrentUser(storedUser);
        setIsAuthenticated(true);
        console.log('[AdminAuthContext] Session restored for user:', storedUser.email);
      } catch (e) {
        console.error('[AdminAuthContext] Failed to parse stored user data', e);
        localStorage.removeItem('adminAuthToken');
        localStorage.removeItem('adminUser');
      }
    } else {
      console.log('[AdminAuthContext] No valid session found in localStorage.');
    }
    setIsInitialized(true);
  }, []);

  const login = async (email, password) => {
    console.log('[AdminAuthContext] 1. login() called for email:', email);
    console.log('[AdminAuthContext] 2. Preparing to send POST request to /admin-auth/login');
    
    try {
      const response = await apiServerClient.fetch('/admin-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      console.log('[AdminAuthContext] 3. Response received, status:', response.status);
      const data = await response.json();
      console.log('[AdminAuthContext] 4. Parsed response body:', data);

      if (!response.ok) {
        const errorMessage = data.error || data.message || 'Login failed';
        console.error('[AdminAuthContext] 5. Login failed with error:', errorMessage);
        throw new Error(errorMessage);
      }

      if (data.token && data.user) {
        console.log('[AdminAuthContext] 5. Login successful, storing token in localStorage');
        localStorage.setItem('adminAuthToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        
        setAuthToken(data.token);
        setCurrentUser(data.user);
        setIsAuthenticated(true);
        
        console.log('[AdminAuthContext] 6. State updated, returning user object');
        return data.user;
      } else {
        throw new Error('Invalid response format: missing token or user');
      }
    } catch (error) {
      console.error('[AdminAuthContext] Error during login flow:', error);
      throw error;
    }
  };

  const logout = useCallback(() => {
    console.log('[AdminAuthContext] logout() called');
    localStorage.removeItem('adminAuthToken');
    localStorage.removeItem('adminUser');
    setAuthToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    console.log('[AdminAuthContext] localStorage and state cleared');
  }, []);

  const value = {
    currentUser,
    authToken,
    isAuthenticated,
    isInitialized,
    login,
    logout
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};