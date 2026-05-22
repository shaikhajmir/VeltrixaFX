const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbRun, dbGet } = require('../database');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

// REGISTER ENDPOINT
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  try {
    // Check if user already exists
    const existingUser = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const userResult = await dbRun(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );
    const userId = userResult.id;

    // Create profile
    // Generate a default API Key
    const apiKey = 'vx_live_ak_' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    await dbRun(
      'INSERT INTO profiles (user_id, api_key, country, phone) VALUES (?, ?, ?, ?)',
      [userId, apiKey, 'United Kingdom', '+44 7700 900123']
    );

    // Create wallet with starting balance $10,000 USD
    await dbRun(
      'INSERT INTO wallets (user_id, balance, currency) VALUES (?, 10000.0, ?)',
      [userId, 'USD']
    );

    // Add an initial registration deposit record
    const txHash = '0x' + Math.random().toString(16).substring(2, 12) + Math.random().toString(16).substring(2, 12);
    await dbRun(
      'INSERT INTO transactions (user_id, type, amount, status, tx_hash) VALUES (?, ?, ?, ?, ?)',
      [userId, 'Deposit', 10000.0, 'Completed', txHash]
    );

    // Create KYC record
    await dbRun(
      'INSERT INTO kyc (user_id, status) VALUES (?, ?)',
      [userId, 'Unverified']
    );

    res.status(201).json({ message: 'Registration successful! Please login.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// LOGIN ENDPOINT
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password.' });
  }

  try {
    // Find user
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Match password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Sign JWT token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.json({
      message: 'Login successful.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// LOGOUT ENDPOINT
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully.' });
});

// GET ME ENDPOINT
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const profile = await dbGet('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
    const wallet = await dbGet('SELECT * FROM wallets WHERE user_id = ?', [req.user.id]);
    const kycRecord = await dbGet('SELECT status FROM kyc WHERE user_id = ?', [req.user.id]);

    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      phone: profile ? profile.phone : null,
      country: profile ? profile.country : null,
      tier: profile ? profile.tier : 'Bronze',
      apiKey: profile ? profile.api_key : null,
      balance: wallet ? wallet.balance : 0.0,
      currency: wallet ? wallet.currency : 'USD',
      kycStatus: kycRecord ? kycRecord.status : 'Unverified'
    });
  } catch (error) {
    console.error('Get profile details error:', error);
    res.status(500).json({ message: 'Server error fetching user details.' });
  }
});

// PASSWORD RECOVERY REQUEST
router.post('/password-recovery', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email address is required.' });
  }

  try {
    const user = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address.' });
    }

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Store or replace OTP row
    await dbRun(
      'INSERT OR REPLACE INTO password_recoveries (email, code, expires_at) VALUES (?, ?, ?)',
      [email, otp, expiresAt]
    );

    res.json({
      message: 'A 6-digit verification code has been generated.',
      email,
      code: otp // Returned directly to simplify deployment & staging verification
    });
  } catch (error) {
    console.error('Password recovery request error:', error);
    res.status(500).json({ message: 'Server error during password recovery.' });
  }
});

// VERIFY OTP CODE
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and 6-digit OTP code are required.' });
  }

  try {
    const recovery = await dbGet(
      'SELECT * FROM password_recoveries WHERE email = ? AND code = ?',
      [email, otp.trim()]
    );

    if (!recovery) {
      return res.status(400).json({ message: 'Invalid or incorrect verification code.' });
    }

    if (new Date(recovery.expires_at) < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    res.json({ message: 'OTP verified successfully.', email, otp });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error verifying OTP code.' });
  }
});

// PASSWORD RESET SUBMIT
router.post('/password-reset', async (req, res) => {
  const { email, otp, password } = req.body;
  if (!email || !otp || !password) {
    return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  try {
    // Re-verify code validity
    const recovery = await dbGet(
      'SELECT * FROM password_recoveries WHERE email = ? AND code = ?',
      [email, otp.trim()]
    );

    if (!recovery) {
      return res.status(400).json({ message: 'Invalid request or expired verification code.' });
    }

    if (new Date(recovery.expires_at) < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired.' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update DB
    await dbRun('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);

    // Delete recovery record
    await dbRun('DELETE FROM password_recoveries WHERE email = ?', [email]);

    res.json({ message: 'Password reset successful! You can now log in.' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error performing password reset.' });
  }
});

module.exports = router;
