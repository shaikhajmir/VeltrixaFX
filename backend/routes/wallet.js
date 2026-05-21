const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../database');
const { authMiddleware } = require('../middleware/auth');

// GET WALLET BALANCE AND TRANSACTIONS
router.get('/info', authMiddleware, async (req, res) => {
  try {
    const wallet = await dbGet('SELECT * FROM wallets WHERE user_id = ?', [req.user.id]);
    const transactions = await dbAll(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp DESC',
      [req.user.id]
    );

    res.json({
      balance: wallet ? wallet.balance : 0.0,
      currency: wallet ? wallet.currency : 'USD',
      transactions: transactions || []
    });
  } catch (error) {
    console.error('Wallet info error:', error);
    res.status(500).json({ message: 'Server error retrieving wallet details.' });
  }
});

// DEPOSIT FUNDS
router.post('/deposit', authMiddleware, async (req, res) => {
  const { amount } = req.body;
  const depositAmount = parseFloat(amount);

  if (isNaN(depositAmount) || depositAmount <= 0) {
    return res.status(400).json({ message: 'Please provide a valid deposit amount greater than 0.' });
  }

  try {
    // 1. Update wallet balance
    await dbRun(
      'UPDATE wallets SET balance = balance + ? WHERE user_id = ?',
      [depositAmount, req.user.id]
    );

    // 2. Generate random mock crypto/bank transaction hash
    const txHash = '0x' + Math.random().toString(16).substring(2, 12) + Math.random().toString(16).substring(2, 12);

    // 3. Create transaction record
    await dbRun(
      'INSERT INTO transactions (user_id, type, amount, status, tx_hash) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'Deposit', depositAmount, 'Completed', txHash]
    );

    // 4. Retrieve updated wallet info
    const wallet = await dbGet('SELECT * FROM wallets WHERE user_id = ?', [req.user.id]);

    res.json({
      message: `Successfully deposited $${depositAmount.toFixed(2)} USD.`,
      balance: wallet.balance,
      txHash
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ message: 'Server error performing deposit.' });
  }
});

// WITHDRAW FUNDS
router.post('/withdraw', authMiddleware, async (req, res) => {
  const { amount } = req.body;
  const withdrawAmount = parseFloat(amount);

  if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
    return res.status(400).json({ message: 'Please provide a valid withdrawal amount greater than 0.' });
  }

  try {
    // 1. Check current wallet balance
    const wallet = await dbGet('SELECT balance FROM wallets WHERE user_id = ?', [req.user.id]);
    
    if (!wallet || wallet.balance < withdrawAmount) {
      return res.status(400).json({ message: 'Insufficient funds for this withdrawal.' });
    }

    // 2. Deduct from wallet balance
    await dbRun(
      'UPDATE wallets SET balance = balance - ? WHERE user_id = ?',
      [withdrawAmount, req.user.id]
    );

    // 3. Generate random mock transaction hash
    const txHash = '0x' + Math.random().toString(16).substring(2, 12) + Math.random().toString(16).substring(2, 12);

    // 4. Create transaction record
    await dbRun(
      'INSERT INTO transactions (user_id, type, amount, status, tx_hash) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'Withdrawal', withdrawAmount, 'Completed', txHash]
    );

    // 5. Retrieve updated wallet info
    const updatedWallet = await dbGet('SELECT * FROM wallets WHERE user_id = ?', [req.user.id]);

    res.json({
      message: `Successfully withdrew $${withdrawAmount.toFixed(2)} USD.`,
      balance: updatedWallet.balance,
      txHash
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ message: 'Server error performing withdrawal.' });
  }
});

module.exports = router;
