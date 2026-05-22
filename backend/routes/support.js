const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../database');
const { authMiddleware } = require('../middleware/auth');

// GET USER'S OPEN SUPPORT TICKETS
router.get('/tickets', authMiddleware, async (req, res) => {
  try {
    let tickets = await dbAll(
      'SELECT * FROM support_tickets WHERE user_id = ? ORDER BY timestamp DESC',
      [req.user.id]
    );

    // Seed a welcome ticket if they have none
    if (tickets.length === 0) {
      await dbRun(
        'INSERT INTO support_tickets (user_id, category, subject, message, status) VALUES (?, ?, ?, ?, ?)',
        [
          req.user.id,
          'Account',
          'Welcome to VeltrixaFX VIP Institutional Portal',
          'Hello! Welcome to the premium trading terminal. Your enterprise security environment is active. Reach out to our 24/7 technical desk for API connectivity, KYC verification, or custom leverage changes.',
          'Resolved'
        ]
      );

      tickets = await dbAll(
        'SELECT * FROM support_tickets WHERE user_id = ? ORDER BY timestamp DESC',
        [req.user.id]
      );
    }

    res.json(tickets);
  } catch (error) {
    console.error('Fetch support tickets error:', error);
    res.status(500).json({ message: 'Server error retrieving support tickets.' });
  }
});

// SUBMIT A NEW SUPPORT TICKET
router.post('/ticket', authMiddleware, async (req, res) => {
  const { category, subject, message } = req.body;

  if (!category || !subject || !message) {
    return res.status(400).json({ message: 'Category, subject, and message are required fields.' });
  }

  try {
    const result = await dbRun(
      'INSERT INTO support_tickets (user_id, category, subject, message, status) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, category, subject, message, 'Open']
    );

    res.status(201).json({
      message: 'Support ticket submitted successfully! An analyst has been assigned.',
      ticketId: result.id,
      category,
      subject,
      status: 'Open'
    });
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({ message: 'Server error submitting support ticket.' });
  }
});

module.exports = router;
