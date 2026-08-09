import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import apiServerClient from '@/lib/apiServerClient.js';
import pb from '@/lib/pocketbaseClient.js';

const AdminAuthContext = createContext(null);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error(
      'useAdminAuth must be used within an AdminAuthProvider'
    );
  }

  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  /*
   * Restore the admin session when the application starts.
   */
  useEffect(() => {
    let cancelled = false;

    const clearStoredSession = () => {
      localStorage.removeItem('adminAuthToken');
      localStorage.removeItem('adminUser');
      pb.authStore.clear();

      if (!cancelled) {
        setAuthToken(null);
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    };

    const initializeSession = async () => {
      console.log('[AdminAuthContext] Verifying stored admin session...');

      const storedToken = localStorage.getItem('adminAuthToken');
      const storedUserString = localStorage.getItem('adminUser');

      if (!storedToken || !storedUserString) {
        clearStoredSession();
        if (!cancelled) setIsInitialized(true);
        return;
      }

      try {
        const storedUser = JSON.parse(storedUserString);

        if (
          storedUser?.role !== 'admin' &&
          storedUser?.is_admin !== true
        ) {
          throw new Error('Stored user is not an administrator.');
        }

        const response = await apiServerClient.fetch('/admin-auth/verify', {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Session verification failed: ${response.status}`);
        }

        const data = await response.json();

        if (!data.valid || !data.user) {
          throw new Error('The stored admin session is invalid.');
        }

        const verifiedToken = data.token || storedToken;

        pb.authStore.save(verifiedToken, data.user);
        localStorage.setItem('adminAuthToken', verifiedToken);
        localStorage.setItem('adminUser', JSON.stringify(data.user));

        if (!cancelled) {
          setAuthToken(verifiedToken);
          setCurrentUser(data.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.warn(
          '[AdminAuthContext] Stored session rejected; login is required:',
          error
        );
        clearStoredSession();
      } finally {
        if (!cancelled) setIsInitialized(true);
      }
    };

    initializeSession();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Log in through the API server.
   */
  const login = async (email, password) => {
    console.log(
      '[AdminAuthContext] Login attempt started for:',
      email
    );

    const response = await apiServerClient.fetch('/admin-auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    /*
     * Read the response safely because some server errors may return
     * an empty or non-JSON response.
     */
    const responseText = await response.text();

    let data = {};

    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        console.error(
          '[AdminAuthContext] Invalid API response:',
          responseText
        );

        throw new Error(
          `The server returned an invalid response. Status: ${response.status}`
        );
      }
    }

    if (!response.ok) {
      const errorMessage =
        data.error ||
        data.message ||
        `Login failed. Server status: ${response.status}`;

      throw new Error(errorMessage);
    }

    if (!data.token || !data.user) {
      throw new Error(
        'Invalid login response: token or user information is missing.'
      );
    }

    /*
     * Save the API session.
     */
    localStorage.setItem('adminAuthToken', data.token);
    localStorage.setItem('adminUser', JSON.stringify(data.user));

    /*
     * Synchronize the same token with the PocketBase SDK.
     */
    pb.authStore.save(data.token, data.user);

    setAuthToken(data.token);
    setCurrentUser(data.user);
    setIsAuthenticated(true);

    console.log(
      '[AdminAuthContext] Login successful for:',
      data.user.email
    );

    return data.user;
  };

  /*
   * Clear both the API session and the PocketBase SDK session.
   */
  const logout = useCallback(() => {
    console.log('[AdminAuthContext] Logging out...');

    localStorage.removeItem('adminAuthToken');
    localStorage.removeItem('adminUser');

    pb.authStore.clear();

    setAuthToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);

    console.log('[AdminAuthContext] Logout completed.');
  }, []);

  const value = {
    currentUser,
    authToken,
    isAuthenticated,
    isInitialized,
    login,
    logout,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
