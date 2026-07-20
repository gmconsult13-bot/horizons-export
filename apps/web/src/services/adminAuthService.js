import pb from '@/lib/pocketbaseClient.js';

const ADMIN_SESSION_KEY = 'admin_session_expiry';
// 24 hours in milliseconds
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

export const adminAuthService = {
  async adminLogin(email, password) {
    console.log('[AdminAuthService] Attempting PocketBase login for:', email);

    try {
      // Call PocketBase directly to authenticate
      const authData = await pb.collection('users').authWithPassword(email, password, { 
        $autoCancel: false 
      });

      // Check if the authenticated user has admin privileges
      const user = authData.record;
      if (!user.is_admin && user.role !== 'admin') {
        console.warn('[AdminAuthService] User authenticated but lacks admin role/flag.');
        pb.authStore.clear();
        throw new Error('Unauthorized: User is not an admin.');
      }

      console.log('[AdminAuthService] PocketBase login successful. Admin verified.');

      // Set session expiry for auto-logout in localStorage
      const expiry = Date.now() + SESSION_DURATION_MS;
      localStorage.setItem(ADMIN_SESSION_KEY, expiry.toString());

      return { token: authData.token, record: user };
    } catch (err) {
      console.error('[AdminAuthService] Login error:', err.message || err);
      pb.authStore.clear();
      localStorage.removeItem(ADMIN_SESSION_KEY);
      throw err;
    }
  },

  adminLogout() {
    console.log('[AdminAuthService] Logging out admin...');
    pb.authStore.clear();
    localStorage.removeItem(ADMIN_SESSION_KEY);
  },

  isAdminAuthenticated() {
    if (!pb.authStore.isValid) return false;
    
    const user = pb.authStore.model;
    if (!user || (!user.is_admin && user.role !== 'admin')) return false;

    const expiry = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!expiry || parseInt(expiry, 10) < Date.now()) {
      console.log('[AdminAuthService] Session expired. Logging out.');
      this.adminLogout();
      return false;
    }

    return true;
  },

  getAdminUser() {
    return this.isAdminAuthenticated() ? pb.authStore.model : null;
  },

  getAdminToken() {
    return this.isAdminAuthenticated() ? pb.authStore.token : null;
  },
  
  extendSession() {
    if (this.isAdminAuthenticated()) {
      const newExpiry = Date.now() + SESSION_DURATION_MS;
      localStorage.setItem(ADMIN_SESSION_KEY, newExpiry.toString());
    }
  }
};