const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Image = require('../models/image');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

function adminMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  try {
    const token = auth.split(' ')[1];
    const user = jwt.verify(token, JWT_SECRET);
    if (!user.is_admin) return res.status(403).json({ error: 'Admin only' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// List all users
router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ users: users.map(user => ({
      id: user._id,
      email: user.email,
      username: user.username,
      is_admin: user.is_admin,
      deleted: user.deleted
    })) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// List all images (including deleted)
router.get('/images', adminMiddleware, async (req, res) => {
  try {
    const images = await Image.getAllImages();
    res.json({ images });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

module.exports = router; 