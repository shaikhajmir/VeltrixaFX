const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const { db } = require('./database');

const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const profileRoutes = require('./routes/profile');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: true, // Allow request from any origin during local testing
  credentials: true
}));

// Core parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/profile', profileRoutes);

// Fallback dynamic endpoint for trading stats / dashboard pairs
app.get('/api/trading/pairs', (req, res) => {
  res.json([
    { symbol: 'EUR/USD', price: '1.0924', change: '+0.15%', type: 'Forex', spread: '0.1' },
    { symbol: 'GBP/USD', price: '1.2743', change: '-0.08%', type: 'Forex', spread: '0.2' },
    { symbol: 'USD/JPY', price: '156.42', change: '+0.42%', type: 'Forex', spread: '0.1' },
    { symbol: 'BTC/USD', price: '68,245.00', change: '+2.85%', type: 'Crypto', spread: '1.5' },
    { symbol: 'ETH/USD', price: '3,842.10', change: '+3.12%', type: 'Crypto', spread: '0.8' },
    { symbol: 'GOLD (XAU/USD)', price: '2,342.50', change: '+0.68%', type: 'Commodity', spread: '0.3' }
  ]);
});

// Serve frontend static assets
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Redirect root to home landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'emerald_obsidian_edition.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Express Error:', err.message);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` VeltrixaFX Backend Server is running!`);
  console.log(` Access terminal locally at http://localhost:${PORT}`);
  console.log(`=================================================`);
});
