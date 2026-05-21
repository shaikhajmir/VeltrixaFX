const jwt = require('jsonwebtoken');
const { dbGet } = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'veltrixafx_super_secret_key_123';

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required. Please log in.' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch user details from DB
    const user = await dbGet('SELECT id, name, email FROM users WHERE id = ?', [decoded.id]);
    
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ message: 'Session expired or invalid. Please log in again.' });
  }
};

module.exports = {
  authMiddleware,
  JWT_SECRET
};
