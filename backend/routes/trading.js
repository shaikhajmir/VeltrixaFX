const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../database');
const { authMiddleware } = require('../middleware/auth');

// 1. Live Prices Simulated Engine (Random-Walk)
const livePrices = {
  'BTC/USD': { price: 64281.42, change: 2.41, high: 65892.00, low: 62105.50, trend: 1 },
  'ETH/USD': { price: 3382.10, change: 1.12, high: 3450.00, low: 3320.00, trend: 1 },
  'EUR/USD': { price: 1.0819, change: 0.15, high: 1.0850, low: 1.0790, trend: 1 },
  'GBP/USD': { price: 1.2743, change: -0.08, high: 1.2780, low: 1.2700, trend: -1 },
  'USD/JPY': { price: 156.42, change: 0.42, high: 156.80, low: 155.90, trend: 1 },
  'GOLD': { price: 2342.50, change: 0.68, high: 2360.00, low: 2325.00, trend: 1 }
};

// Tick Generator running every second
setInterval(() => {
  for (const symbol in livePrices) {
    const p = livePrices[symbol];
    const isCrypto = symbol.includes('BTC') || symbol.includes('ETH');
    const isForex = symbol.includes('/') && !isCrypto;
    
    // Crypto moves faster, Forex moves slower
    const volatility = isCrypto ? 0.0015 : isForex ? 0.0003 : 0.0006;
    const percent = (Math.random() - 0.49) * volatility;
    
    const oldPrice = p.price;
    p.price = +(p.price * (1 + percent)).toFixed(
      symbol.includes('JPY') || symbol === 'GOLD' ? 2 : isForex ? 5 : 2
    );
    
    p.trend = p.price >= oldPrice ? 1 : -1;
    if (p.price > p.high) p.high = p.price;
    if (p.price < p.low) p.low = p.price;
  }
}, 1000);

// GET CURRENT LIVE PRICING DATA
router.get('/prices', (req, res) => {
  res.json(livePrices);
});

// GET USER'S OPEN POSITIONS (WITH LIVE UNREALIZED PNL / ROE)
router.get('/positions', authMiddleware, async (req, res) => {
  try {
    const positions = await dbAll('SELECT * FROM positions WHERE user_id = ? ORDER BY timestamp DESC', [req.user.id]);
    
    const positionsWithPnl = positions.map(pos => {
      const ticker = livePrices[pos.symbol];
      const markPrice = ticker ? ticker.price : pos.entry_price;
      
      let pnl = 0.0;
      if (pos.side === 'LONG') {
        pnl = pos.size * (markPrice - pos.entry_price);
      } else {
        pnl = pos.size * (pos.entry_price - markPrice);
      }
      
      // Calculate return on equity
      const roe = (pnl / pos.margin) * 100;
      
      return {
        ...pos,
        markPrice,
        pnl: +pnl.toFixed(2),
        roe: +roe.toFixed(2)
      };
    });
    
    res.json(positionsWithPnl);
  } catch (error) {
    console.error('Fetch positions error:', error);
    res.status(500).json({ message: 'Server error retrieving open positions.' });
  }
});

// OPEN A LEVERAGED POSITION (BUY/LONG OR SELL/SHORT)
router.post('/order', authMiddleware, async (req, res) => {
  const { symbol, side, size, leverage } = req.body;
  const positionSize = parseFloat(size);
  const positionLeverage = parseInt(leverage);

  if (!symbol || !livePrices[symbol]) {
    return res.status(400).json({ message: 'Please provide a valid trading instrument symbol.' });
  }

  if (side !== 'LONG' && side !== 'SHORT') {
    return res.status(400).json({ message: 'Side must be either LONG or SHORT.' });
  }

  if (isNaN(positionSize) || positionSize <= 0) {
    return res.status(400).json({ message: 'Please provide a valid trade size greater than 0.' });
  }

  if (isNaN(positionLeverage) || positionLeverage < 1 || positionLeverage > 100) {
    return res.status(400).json({ message: 'Leverage must be an integer between 1x and 100x.' });
  }

  try {
    // 1. Get current mark price
    const entryPrice = livePrices[symbol].price;

    // 2. Calculate margin requirement
    // margin = (size * price) / leverage
    const totalNotional = positionSize * entryPrice;
    const requiredMargin = +(totalNotional / positionLeverage).toFixed(2);

    // 3. Ensure user has enough wallet balance
    const wallet = await dbGet('SELECT balance FROM wallets WHERE user_id = ?', [req.user.id]);
    if (!wallet || wallet.balance < requiredMargin) {
      return res.status(400).json({ 
        message: `Insufficient wallet balance. Required Margin: $${requiredMargin.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD, available: $${wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD.` 
      });
    }

    // 4. Deduct margin from wallet balance
    await dbRun(
      'UPDATE wallets SET balance = balance - ? WHERE user_id = ?',
      [requiredMargin, req.user.id]
    );

    // 5. Generate random mock transaction hash
    const txHash = '0x' + Math.random().toString(16).substring(2, 12) + Math.random().toString(16).substring(2, 12);

    // 6. Record margin lock transaction in ledger as a Withdrawal
    await dbRun(
      'INSERT INTO transactions (user_id, type, amount, status, tx_hash) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'Withdrawal', requiredMargin, 'Completed', txHash]
    );

    // 7. Insert the open position row
    const result = await dbRun(
      'INSERT INTO positions (user_id, symbol, side, size, entry_price, leverage, margin) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, symbol, side, positionSize, entryPrice, positionLeverage, requiredMargin]
    );

    res.status(201).json({
      message: `Successfully opened ${side} position for ${positionSize} ${symbol.split('/')[0]}!`,
      positionId: result.id,
      margin: requiredMargin,
      entryPrice,
      txHash
    });
  } catch (error) {
    console.error('Open position error:', error);
    res.status(500).json({ message: 'Server error opening trading position.' });
  }
});

// CLOSE AN ACTIVE POSITION (EXECUTES REALISED PNL REFUND)
router.post('/close', authMiddleware, async (req, res) => {
  const { positionId } = req.body;

  if (!positionId) {
    return res.status(400).json({ message: 'Please specify the position ID to close.' });
  }

  try {
    // 1. Fetch position details
    const position = await dbGet('SELECT * FROM positions WHERE id = ? AND user_id = ?', [positionId, req.user.id]);
    if (!position) {
      return res.status(404).json({ message: 'Position not found or unauthorized.' });
    }

    // 2. Fetch current mark price
    const markPrice = livePrices[position.symbol].price;

    // 3. Compute final realised P&L
    let pnl = 0.0;
    if (position.side === 'LONG') {
      pnl = position.size * (markPrice - position.entry_price);
    } else {
      pnl = position.size * (position.entry_price - markPrice);
    }

    // 4. Calculate refunded collateral
    // refund = margin + PNL (liquidated at 0)
    const refundAmount = +Math.max(0, position.margin + pnl).toFixed(2);
    const roundedPnl = +pnl.toFixed(2);

    // 5. Refund margin + PNL to wallet balance
    await dbRun(
      'UPDATE wallets SET balance = balance + ? WHERE user_id = ?',
      [refundAmount, req.user.id]
    );

    // 6. Generate mock transaction hash
    const txHash = '0x' + Math.random().toString(16).substring(2, 12) + Math.random().toString(16).substring(2, 12);

    // 7. Record transaction ledger entry as a Deposit
    await dbRun(
      'INSERT INTO transactions (user_id, type, amount, status, tx_hash) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'Deposit', refundAmount, 'Completed', txHash]
    );

    // 8. Delete position from active DB table
    await dbRun('DELETE FROM positions WHERE id = ?', [positionId]);

    res.json({
      message: `Successfully closed ${position.symbol} position!`,
      pnl: roundedPnl,
      refundAmount,
      markPrice,
      txHash
    });
  } catch (error) {
    console.error('Close position error:', error);
    res.status(500).json({ message: 'Server error closing trading position.' });
  }
});

module.exports = router;
