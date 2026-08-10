import React, { createContext, useContext, useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';

const GuestAuthContext = createContext();

export const GuestAuthProvider = ({ children }) => {
  const [currentGuest, setCurrentGuest] = useState(pb.authStore.model);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setCurrentGuest(pb.authStore.model);
    
    // Subscribe to PocketBase auth state changes
    const unsub = pb.authStore.onChange((token, model) => {
      setCurrentGuest(model);
    });
    
    setIsLoading(false);
    return () => unsub();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('[GuestAuth] Attempting login for:', email);
      const authData = await pb.collection('guests').authWithPassword(email, password, { $autoCancel: false });
      console.log('[GuestAuth] Login successful.');
      return authData;
    } catch (error) {
      console.error('[GuestAuth] Login failed:', error.response || error);
      throw error;
    }
  };

  const register = async (email, password, passwordConfirm, phone) => {
    try {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      const normalizedPhone = String(phone || '').trim();
      if (!normalizedEmail || !normalizedPhone || !password || !passwordConfirm) {
        throw new Error('All registration fields are required.');
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        throw new Error('Invalid email address format.');
      }
      if (!/^\+?[\d\s-]{8,20}$/.test(normalizedPhone)) {
        throw new Error('Invalid phone number format.');
      }
      if (password.length < 8) throw new Error('Password must be at least 8 characters long.');
      if (password !== passwordConfirm) throw new Error('Passwords do not match.');

      console.log('[GuestAuth] Attempting to create guest record...');
      
      // Ensure all required fields including emailVerified are passed to prevent schema issues
      const payload = {
        email: normalizedEmail,
        password,
        passwordConfirm,
        phone: normalizedPhone,
        emailVerified: false,
        email_verified: false
      };
      
      console.log('[GuestAuth] Registration payload:', { 
        ...payload, 
        password: '[REDACTED]', 
        passwordConfirm: '[REDACTED]' 
      });

      const record = await pb.collection('guests').create(payload, { $autoCancel: false });
      console.log('[GuestAuth] Guest record created successfully with ID:', record.id);
      
      return record;
    } catch (error) {
      console.error('[GuestAuth] Registration failed:', error.response || error);
      throw error;
    }
  };

  const logout = () => {
    pb.authStore.clear();
    setCurrentGuest(null);
  };

  // We consider them a guest if they are authenticated and belong to the 'guests' collection
  const isGuestAuthenticated = pb.authStore.isValid && currentGuest?.collectionName === 'guests';

  return (
    <GuestAuthContext.Provider value={{ 
      currentGuest, 
      isGuestAuthenticated, 
      isLoading,
      login, 
      register, 
      logout 
    }}>
      {children}
    </GuestAuthContext.Provider>
  );
};

export const useGuestAuth = () => useContext(GuestAuthContext);
