import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import apiServerClient from '@/lib/apiServerClient.js';
import pb from '@/lib/pocketbaseClient.js';

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
  const inactivityTimer = useRef(null);

  const clearSession = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    localStorage.removeItem('adminAuthToken');
    localStorage.removeItem('adminUser');
    if (pb.authStore.model?.collectionName === 'users') pb.authStore.clear();
    setAuthToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
  }, []);

  // An administrator must explicitly sign in after every reload/new visit.
  useEffect(() => {
    clearSession();
    setIsInitialized(true);
  }, [clearSession]);

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
        pb.authStore.save(data.token, data.user);
        
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

  const logout = useCallback(() => clearSession(), [clearSession]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const resetTimer = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(clearSession, 40_000);
    };
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [isAuthenticated, clearSession]);

  const value = {
    currentUser,
    adminUser: currentUser,
    authToken,
    isAuthenticated,
    isAdminAuthenticated: isAuthenticated,
    isInitialized,
    loading: !isInitialized,
    login,
    adminLogin: login,
    logout,
    adminLogout: logout
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
