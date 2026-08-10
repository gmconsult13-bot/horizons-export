import 'dotenv/config';
import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// POST /admin-auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Step 1: Log request body
  console.log('\n=== ADMIN LOGIN REQUEST ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Email received:', email);
  console.log('Password received:', password ? '[REDACTED - ' + password.length + ' chars]' : 'undefined');

  // Validate required fields
  if (!email || !password) {
    console.error('✗ Missing required fields: email or password');
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Step 2: Attempt password authentication with PocketBase
    console.log('\nStep 1: Attempting pb.collection("users").authWithPassword()');
    console.log('Auth parameters - email:', email, 'password: [REDACTED]');
    
    let authData;
    try {
      authData = await pb.collection('users').authWithPassword(email, password);
      console.log('✓ authWithPassword succeeded');
    } catch (authError) {
      console.error('✗ authWithPassword failed');
      console.error('Error type:', authError.constructor.name);
      console.error('Error message:', authError.message);
      console.error('Error status:', authError.status);
      console.error('Error response:', authError.response);
      console.error('Full error:', JSON.stringify(authError, null, 2));
      throw authError;
    }

    // Step 3: Log auth response
    console.log('\nStep 2: Auth response received');
    console.log('Token present:', authData.token ? 'Yes' : 'No');
    console.log('Token length:', authData.token ? authData.token.length : 0);
    console.log('User record present:', authData.record ? 'Yes' : 'No');
    
    if (!authData.record) {
      console.error('✗ No user record in auth response');
      throw new Error('No user record returned from authentication');
    }

    const user = authData.record;
    console.log('\nStep 3: User record details');
    console.log('User ID:', user.id);
    console.log('User email:', user.email);
    console.log('User name:', user.name);
    console.log('User role:', user.role);
    console.log('User is_admin:', user.is_admin);
    console.log('Full user record:', JSON.stringify(user, null, 2));

    // Step 4: Verify admin status
    console.log('\nStep 4: Verifying admin status');
    const isAdmin = user.is_admin === true || user.role === 'admin';
    console.log('is_admin field value:', user.is_admin);
    console.log('role field value:', user.role);
    console.log('Admin check result:', isAdmin);
    
    if (!isAdmin) {
      console.error('✗ User is not an admin');
      console.error('is_admin:', user.is_admin, 'role:', user.role);
      return res.status(403).json({ error: 'User is not an admin' });
    }

    // Step 5: Return success response
    console.log('\nStep 5: Login successful');
    console.log('Returning token and user details');
    console.log('=== LOGIN SUCCESS ===\n');

    res.json({
      success: true,
      token: authData.token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_admin: user.is_admin,
      },
    });
  } catch (error) {
    console.error('\n=== LOGIN ERROR ===');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error status:', error.status);
    console.error('Error response:', error.response);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', JSON.stringify(error, null, 2));

    // Determine error type and return appropriate message
    if (error.message && error.message.includes('Failed to find record')) {
      console.error('Specific error: User not found in database');
      return res.status(404).json({ error: 'User not found' });
    }

    if (error.message && error.message.includes('Invalid password')) {
      console.error('Specific error: Invalid password provided');
      return res.status(401).json({ error: 'Invalid password' });
    }

    if (error.status === 401 || (error.message && error.message.includes('Unauthorized'))) {
      console.error('Specific error: Authentication failed - invalid credentials');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (error.message && error.message.includes('No user record')) {
      console.error('Specific error: No user record in auth response');
      return res.status(500).json({ 
        error: 'Authentication error',
        details: 'No user record returned from authentication',
        type: error.constructor.name
      });
    }

    // Generic error response with details
    console.error('Generic error response being sent');
    return res.status(500).json({ 
      error: 'Login failed',
      details: error.message,
      type: error.constructor.name
    });
  }
});

// POST /admin-auth/logout
router.post('/logout', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  logger.info(`Admin user ${userId} logged out`);
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /admin-auth/verify
router.get('/verify', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  // Fetch user details from PocketBase to verify they still exist and are admin
  const user = await pb.collection('users').getOne(userId);

  // Verify admin status
  const isAdmin = user.is_admin === true || user.role === 'admin';
  if (!isAdmin) {
    throw new Error('User is not an admin');
  }

  logger.info(`Token verified for admin user ${userId}`);
  res.json({
    valid: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_admin: user.is_admin,
    },
  });
});

// GET /admin-auth/me
router.get('/me', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  // Fetch current user details from PocketBase
  const user = await pb.collection('users').getOne(userId);

  logger.info(`Fetched profile for admin user ${userId}`);
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_admin: user.is_admin,
    },
  });
});

export default router;