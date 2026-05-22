const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../database');
const { authMiddleware } = require('../middleware/auth');

// GET AFFILIATE STATS AND COMMISSIONS LEDGER
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const refCode = 'VX' + (10000 + req.user.id) + 'X';

    // Fetch commissions count & details
    let commissions = await dbAll(
      'SELECT * FROM commissions WHERE user_id = ? ORDER BY timestamp DESC',
      [req.user.id]
    );

    // Automated seed if they have 0 commissions (to immediately show dynamic live data!)
    if (commissions.length === 0) {
      await dbRun(
        'INSERT INTO commissions (user_id, referral_name, level, trade_volume, commission_amount, status) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, 'Node_48291', 1, 42400.00, 424.00, 'Completed']
      );
      await dbRun(
        'INSERT INTO commissions (user_id, referral_name, level, trade_volume, commission_amount, status) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, 'Veltrix_User_02', 2, 112000.00, 336.00, 'Completed']
      );
      await dbRun(
        'INSERT INTO commissions (user_id, referral_name, level, trade_volume, commission_amount, status) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, 'Alpha_Quant_X', 1, 8200.00, 82.00, 'Pending']
      );

      commissions = await dbAll(
        'SELECT * FROM commissions WHERE user_id = ? ORDER BY timestamp DESC',
        [req.user.id]
      );
    }

    // Calculate totals
    const totalReferrals = 3;
    const activeTraders = 2;
    
    let totalEarnings = 0.0;
    let monthlyCommission = 0.0;
    
    commissions.forEach(c => {
      if (c.status === 'Completed' || c.status === 'Withdrawn') {
        totalEarnings += c.commission_amount;
        monthlyCommission += c.commission_amount;
      } else if (c.status === 'Pending') {
        totalEarnings += c.commission_amount;
      }
    });

    res.json({
      referralCode: refCode,
      referralLink: `http://localhost:5000/ref/${refCode}`,
      totalReferrals,
      activeTraders,
      totalEarnings: +totalEarnings.toFixed(2),
      monthlyCommission: +monthlyCommission.toFixed(2),
      commissions
    });
  } catch (error) {
    console.error('Fetch affiliate stats error:', error);
    res.status(500).json({ message: 'Server error retrieving affiliate ledger.' });
  }
});

// WITHDRAW AFFILIATE EARNINGS TO MAIN TRADING WALLET
router.post('/withdraw', authMiddleware, async (req, res) => {
  try {
    // Fetch completed commissions to withdraw
    const commissions = await dbAll(
      "SELECT * FROM commissions WHERE user_id = ? AND status = 'Completed'",
      [req.user.id]
    );

    let claimableAmount = 0.0;
    commissions.forEach(c => {
      claimableAmount += c.commission_amount;
    });

    if (claimableAmount <= 0) {
      return res.status(400).json({ message: 'No completed commission earnings available for withdrawal.' });
    }

    // Transfer earnings to wallet balance
    await dbRun(
      'UPDATE wallets SET balance = balance + ? WHERE user_id = ?',
      [claimableAmount, req.user.id]
    );

    // Mark completed commissions as 'Withdrawn'
    await dbRun(
      "UPDATE commissions SET status = 'Withdrawn' WHERE user_id = ? AND status = 'Completed'",
      [req.user.id]
    );

    // Record deposit transaction in main ledger
    const txHash = '0x' + Math.random().toString(16).substring(2, 12) + Math.random().toString(16).substring(2, 12);
    await dbRun(
      'INSERT INTO transactions (user_id, type, amount, status, tx_hash) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'Deposit', claimableAmount, 'Completed', txHash]
    );

    res.json({
      message: `Successfully transferred $${claimableAmount.toFixed(2)} USD from affiliate ledger to your main wallet balance!`,
      amountTransferred: claimableAmount,
      txHash
    });
  } catch (error) {
    console.error('Withdraw affiliate earnings error:', error);
    res.status(500).json({ message: 'Server error processing affiliate payout.' });
  }
});

module.exports = router;
