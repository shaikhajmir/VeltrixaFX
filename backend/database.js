const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'veltrixafx.db');

// Connect to SQLite Database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to VeltrixaFX SQLite Database.');
  }
});

// Helper functions to wrap sqlite3 with Promises for async/await support
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Initialize Tables
async function initDatabase() {
  try {
    // 1. Users Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Profiles Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS profiles (
        user_id INTEGER UNIQUE,
        phone TEXT,
        country TEXT DEFAULT 'United Kingdom',
        tier TEXT DEFAULT 'Bronze',
        api_key TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 3. Wallets Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS wallets (
        user_id INTEGER UNIQUE,
        balance REAL DEFAULT 10000.0,
        currency TEXT DEFAULT 'USD',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 4. Transactions Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT NOT NULL, -- 'Deposit' or 'Withdrawal'
        amount REAL NOT NULL,
        status TEXT DEFAULT 'Completed', -- 'Completed' or 'Pending' or 'Failed'
        tx_hash TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 5. KYC Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS kyc (
        user_id INTEGER UNIQUE,
        status TEXT DEFAULT 'Unverified', -- 'Unverified', 'Pending', 'Verified'
        document_type TEXT,
        document_number TEXT,
        submitted_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 6. Positions Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        symbol TEXT NOT NULL,
        side TEXT NOT NULL,
        size REAL NOT NULL,
        entry_price REAL NOT NULL,
        leverage INTEGER NOT NULL,
        margin REAL NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('Database tables successfully initialized.');
  } catch (error) {
    console.error('Error initializing database tables:', error);
  }
}

// Initialize tables immediately
initDatabase();

module.exports = {
  db,
  dbRun,
  dbGet,
  dbAll
};
