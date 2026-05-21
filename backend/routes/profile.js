const express = require('express');
const router = express.Router();
const { dbRun, dbGet } = require('../database');
const { authMiddleware } = require('../middleware/auth');

// UPDATE PROFILE INFORMATION
router.post('/update', authMiddleware, async (req, res) => {
  const { name, phone, country } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Name is a required field.' });
  }

  try {
    // 1. Update user table (name)
    await dbRun('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id]);

    // 2. Update profile table (phone, country)
    await dbRun(
      'UPDATE profiles SET phone = ?, country = ? WHERE user_id = ?',
      [phone || null, country || 'United Kingdom', req.user.id]
    );

    res.json({ message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile details.' });
  }
});

// ROTATE API KEY
router.post('/api-key/rotate', authMiddleware, async (req, res) => {
  try {
    const newApiKey = 'vx_live_ak_' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    await dbRun('UPDATE profiles SET api_key = ? WHERE user_id = ?', [newApiKey, req.user.id]);
    res.json({ message: 'API key successfully rotated.', apiKey: newApiKey });
  } catch (error) {
    console.error('Rotate API key error:', error);
    res.status(500).json({ message: 'Server error rotating API key.' });
  }
});

// SUBMIT KYC
router.post('/kyc/submit', authMiddleware, async (req, res) => {
  const { documentType, documentNumber } = req.body;

  if (!documentType || !documentNumber) {
    return res.status(400).json({ message: 'Document type and document number are required.' });
  }

  try {
    // Simulate instant review: set status to 'Verified' immediately!
    // This allows the user to see the verification state transition perfectly.
    await dbRun(
      'UPDATE kyc SET status = ?, document_type = ?, document_number = ?, submitted_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      ['Verified', documentType, documentNumber, req.user.id]
    );

    // Upgrade tier to 'Premium' as a reward for verifying KYC!
    await dbRun('UPDATE profiles SET tier = ? WHERE user_id = ?', ['Premium', req.user.id]);

    res.json({
      message: 'KYC Verification documents submitted and approved successfully!',
      status: 'Verified',
      tier: 'Premium'
    });
  } catch (error) {
    console.error('KYC submission error:', error);
    res.status(500).json({ message: 'Server error submitting KYC verification.' });
  }
});

module.exports = router;
