const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const router = express.Router();

// Ensure JWT_SECRET is set
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET environment variable is not set! Using fallback secret. This is insecure for production.');
}

// Input validation middleware
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 8;
};

router.post('/register', async (req, res) => {
  console.log('Register request received:', { email: req.body.email, hasPassword: !!req.body.password });
  
  // Check database connection
  if (!req.dbConnected) {
    console.log('Register failed: Database not connected');
    return res.status(503).json({ error: 'Database not available. Please try again later.' });
  }
  
  const { email, password } = req.body;
  
  // Input validation
  if (!email || !password) {
    console.log('Register validation failed: missing email or password');
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  if (!validatePassword(password)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }
  
  try {
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    const user = await User.createUser(email, password);
    console.log('User created successfully:', {
      id: user._id,
      email: user.email,
      passwordHashLength: user.password_hash ? user.password_hash.length : 0,
      passwordHashStart: user.password_hash ? user.password_hash.substring(0, 10) + '...' : 'null'
    });
    
    const token = jwt.sign(
      { id: user._id, email: user.email, is_admin: user.is_admin }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        email: user.email, 
        username: user.username, 
        is_admin: user.is_admin 
      } 
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    console.error('Registration error stack:', err.stack);
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

router.post('/login', async (req, res) => {
  console.log('Login request received:', { email: req.body.email, hasPassword: !!req.body.password });
  
  // Check database connection
  if (!req.dbConnected) {
    console.log('Login failed: Database not connected');
    return res.status(503).json({ error: 'Database not available. Please try again later.' });
  }
  
  const { email, password } = req.body;
  
  // Input validation
  if (!email || !password) {
    console.log('Login validation failed: missing email or password');
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  try {
    const user = await User.findByEmail(email);
    console.log('User found for login:', user ? { 
      id: user._id, 
      email: user.email, 
      hasPasswordHash: !!user.password_hash,
      passwordHashLength: user.password_hash ? user.password_hash.length : 0,
      passwordHashStart: user.password_hash ? user.password_hash.substring(0, 10) + '...' : 'null'
    } : 'null');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Debug: Check if password_hash field exists
    console.log('Available user fields:', Object.keys(user.toObject()));
    console.log('Password hash field check:', {
      password_hash: !!user.password_hash,
      passwordHash: !!user.passwordHash,
      password: !!user.password
    });
    
    const match = await bcrypt.compare(password, user.password_hash);
    console.log('Password comparison details:', {
      inputPassword: password,
      storedHash: user.password_hash,
      match: match
    });
    
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user._id, email: user.email, is_admin: user.is_admin }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        email: user.email, 
        username: user.username, 
        is_admin: user.is_admin 
      } 
    });
  } catch (err) {
    console.error('Login error:', err.message);
    console.error('Login error stack:', err.stack);
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

module.exports = router; 