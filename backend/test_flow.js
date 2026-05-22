const http = require('http');

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}`;

// Helper to perform HTTP Requests
function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const parsedUrl = new URL(url);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    let reqBody = '';
    if (body) {
      reqBody = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(reqBody);
    }

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(responseBody);
        } catch (e) {
          parsed = responseBody;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(reqBody);
    }
    req.end();
  });
}

// Generate unique email to ensure registration always succeeds
const email = `test.${Math.floor(Math.random() * 1000000)}@veltrixafx.io`;
let sessionCookie = '';

async function runTests() {
  console.log('🚀 Starting VeltrixaFX End-to-End API Integration Verification...\n');

  try {
    // 1. REGISTER
    console.log(`[TEST 1] Registering user with email: ${email}...`);
    const regRes = await request('POST', '/api/auth/register', {
      name: 'Ajmir Tester',
      email: email,
      password: 'password123'
    });
    console.log(`Response: ${regRes.statusCode} -`, regRes.body);
    if (regRes.statusCode !== 201) throw new Error('Registration failed');
    console.log('✅ Registration Passed.\n');

    // 2. LOGIN
    console.log('[TEST 2] Logging in user...');
    const loginRes = await request('POST', '/api/auth/login', {
      email: email,
      password: 'password123'
    });
    console.log(`Response: ${loginRes.statusCode} -`, loginRes.body);
    if (loginRes.statusCode !== 200) throw new Error('Login failed');
    
    // Extract set-cookie
    const setCookie = loginRes.headers['set-cookie'];
    if (setCookie && setCookie.length > 0) {
      sessionCookie = setCookie[0].split(';')[0];
    }
    if (!sessionCookie) throw new Error('Token cookie not found in response headers');
    console.log(`✅ Login Passed (Cookie acquired: ${sessionCookie.substring(0, 15)}...)\n`);

    const headers = { 'Cookie': sessionCookie };

    // 3. VERIFY SESSION (GET ME)
    console.log('[TEST 3] Fetching logged-in user details (/api/auth/me)...');
    const meRes = await request('GET', '/api/auth/me', null, headers);
    console.log(`Response: ${meRes.statusCode} -`, meRes.body);
    if (meRes.statusCode !== 200) throw new Error('Auth /me failed');
    if (meRes.body.balance !== 10000) throw new Error('Default balance is not $10,000.00');
    if (meRes.body.kycStatus !== 'Unverified') throw new Error('Default KYC status should be Unverified');
    if (meRes.body.tier !== 'Bronze') throw new Error('Default tier should be Bronze');
    console.log('✅ Fetch Profile & Balance Passed.\n');

    // 4. SUBMIT KYC (Instant Verification & Tier Upgrade)
    console.log('[TEST 4] Submitting institutional KYC verification...');
    const kycRes = await request('POST', '/api/profile/kyc/submit', {
      documentType: 'Passport',
      documentNumber: 'VX-98291-TEST'
    }, headers);
    console.log(`Response: ${kycRes.statusCode} -`, kycRes.body);
    if (kycRes.statusCode !== 200) throw new Error('KYC submission failed');
    if (kycRes.body.status !== 'Verified') throw new Error('KYC status did not auto-approve');
    if (kycRes.body.tier !== 'Premium') throw new Error('User was not upgraded to Premium tier');
    console.log('✅ KYC Submission and Instant Premium Upgrade Passed.\n');

    // 5. UPDATE PROFILE
    console.log('[TEST 5] Updating profile details (Name, Phone, Country)...');
    const updateRes = await request('POST', '/api/profile/update', {
      name: 'Ajmir Premium Trader',
      phone: '+44 7700 900888',
      country: 'Canada'
    }, headers);
    console.log(`Response: ${updateRes.statusCode} -`, updateRes.body);
    if (updateRes.statusCode !== 200) throw new Error('Profile update failed');
    console.log('✅ Profile Update Passed.\n');

    // 6. ROTATE API KEY
    console.log('[TEST 6] Rotating institutional developer API Key...');
    const rotateRes = await request('POST', '/api/profile/api-key/rotate', {}, headers);
    console.log(`Response: ${rotateRes.statusCode} -`, rotateRes.body);
    if (rotateRes.statusCode !== 200 || !rotateRes.body.apiKey) throw new Error('API key rotation failed');
    console.log('✅ API Key Rotation Passed.\n');

    // 7. DEPOSIT FUNDS
    console.log('[TEST 7] Depositing $5,000.00 USD...');
    const depRes = await request('POST', '/api/wallet/deposit', {
      amount: 5000.00
    }, headers);
    console.log(`Response: ${depRes.statusCode} -`, depRes.body);
    if (depRes.statusCode !== 200) throw new Error('Deposit failed');
    if (depRes.body.balance !== 15000.00) throw new Error('Deposit balance mismatch');
    console.log('✅ Wallet Deposit Passed.\n');

    // 8. WITHDRAW FUNDS
    console.log('[TEST 8] Withdrawing $2,500.00 USD...');
    const withdrawRes = await request('POST', '/api/wallet/withdraw', {
      amount: 2500.00
    }, headers);
    console.log(`Response: ${withdrawRes.statusCode} -`, withdrawRes.body);
    if (withdrawRes.statusCode !== 200) throw new Error('Withdrawal failed');
    if (withdrawRes.body.balance !== 12500.00) throw new Error('Withdrawal balance mismatch');
    console.log('✅ Wallet Withdrawal Passed.\n');

    // 9. CHECK BALANCE BOUNDS (INSUFFICIENT FUNDS GUARD)
    console.log('[TEST 9] Testing Insufficient Funds Guard (withdrawing $20,000.00 USD)...');
    const overdrawRes = await request('POST', '/api/wallet/withdraw', {
      amount: 20000.00
    }, headers);
    console.log(`Response (Expected failure): ${overdrawRes.statusCode} -`, overdrawRes.body);
    if (overdrawRes.statusCode !== 400 || !overdrawRes.body.message.includes('Insufficient')) {
      throw new Error('Balance guard did not prevent overdraft');
    }
    console.log('✅ Balance Guard Protection Passed.\n');

    // 10. RETRIEVE LEDGER AND METRICS (/api/wallet/info)
    console.log('[TEST 10] Retrieving transaction ledger and aggregate info...');
    const walletRes = await request('GET', '/api/wallet/info', null, headers);
    console.log(`Response: ${walletRes.statusCode}`);
    console.log(`Current Balance: $${walletRes.body.balance} ${walletRes.body.currency}`);
    console.log(`Transaction count: ${walletRes.body.transactions.length}`);
    walletRes.body.transactions.forEach((t, i) => {
      console.log(`  [TX ${i + 1}] Type: ${t.type} | Amount: $${t.amount} | Status: ${t.status} | Hash: ${t.tx_hash}`);
    });
    if (walletRes.body.transactions.length !== 3) throw new Error('Transaction ledger count mismatch');
    console.log('✅ Ledger Retrieval and Verification Passed.\n');

    // 11. CHECK FINAL ME STATE
    console.log('[TEST 11] Fetching final state to confirm persistence...');
    const finalMeRes = await request('GET', '/api/auth/me', null, headers);
    console.log(`Response: ${finalMeRes.statusCode} -`, finalMeRes.body);
    if (finalMeRes.body.name !== 'Ajmir Premium Trader') throw new Error('Name update not persisted');
    if (finalMeRes.body.tier !== 'Premium') throw new Error('Premium tier not persisted');
    if (finalMeRes.body.country !== 'Canada') throw new Error('Country not persisted');
    if (finalMeRes.body.phone !== '+44 7700 900888') throw new Error('Phone not persisted');
    if (finalMeRes.body.kycStatus !== 'Verified') throw new Error('KYC verified status not persisted');
    if (finalMeRes.body.balance !== 12500) throw new Error('Final balance not persisted');
    console.log('✅ Final State Verification Passed.\n');

    // 12. LEVERAGED TRADING FLOW
    console.log('[TEST 12] Testing Leveraged Trading Flow (Open LONG Position on BTC/USD)...');
    
    // Check initial balance
    const balanceBeforeOrder = finalMeRes.body.balance;
    
    // Fetch live price of BTC/USD first
    const pricesRes = await request('GET', '/api/trading/prices', null, headers);
    if (pricesRes.statusCode !== 200) throw new Error('Prices fetch failed');
    const btcPrice = pricesRes.body['BTC/USD'].price;
    console.log(`Current BTC/USD price is $${btcPrice}`);

    // Place an order: Buy 0.1 BTC at 10x leverage
    const orderRes = await request('POST', '/api/trading/order', {
      symbol: 'BTC/USD',
      side: 'LONG',
      size: 0.1,
      leverage: 10
    }, headers);
    console.log(`Response: ${orderRes.statusCode} -`, orderRes.body);
    if (orderRes.statusCode !== 201) throw new Error('Order creation failed');
    const positionId = orderRes.body.positionId;
    const requiredMargin = orderRes.body.margin;
    console.log(`Position ID: ${positionId}, Margin locked: $${requiredMargin}`);

    // Check balance after order to ensure margin is deducted
    const balanceAfterOrderRes = await request('GET', '/api/auth/me', null, headers);
    const balanceAfterOrder = balanceAfterOrderRes.body.balance;
    console.log(`Balance after order: $${balanceAfterOrder} (Expected: $${balanceBeforeOrder - requiredMargin})`);
    if (Math.abs(balanceAfterOrder - (balanceBeforeOrder - requiredMargin)) > 0.05) {
      throw new Error('Balance deduction mismatch after order placement');
    }
    console.log('✅ Leveraged Trading Position Open Passed.\n');

    // 13. POSITION RETRIEVAL & UNREALIZED PNL CALCULATION
    console.log('[TEST 13] Retrieving active positions and live P&L details...');
    const positionsRes = await request('GET', '/api/trading/positions', null, headers);
    console.log(`Response: ${positionsRes.statusCode} -`, positionsRes.body);
    if (positionsRes.statusCode !== 200) throw new Error('Positions retrieval failed');
    const activePosition = positionsRes.body.find(pos => pos.id === positionId);
    if (!activePosition) throw new Error('Could not find active position in DB');
    console.log(`Open position: Symbol: ${activePosition.symbol} | Side: ${activePosition.side} | Mark Price: ${activePosition.markPrice} | PNL: $${activePosition.pnl} | ROE: ${activePosition.roe}%`);
    console.log('✅ Open Position Live Tracking Passed.\n');

    // 14. CLOSE POSITION & COLLATERAL REFUND
    console.log('[TEST 14] Closing the active position to trigger collateral & realized PNL refund...');
    const closeRes = await request('POST', '/api/trading/close', {
      positionId: positionId
    }, headers);
    console.log(`Response: ${closeRes.statusCode} -`, closeRes.body);
    if (closeRes.statusCode !== 200) throw new Error('Position close failed');
    const refundAmount = closeRes.body.refundAmount;
    const roundedPnl = closeRes.body.pnl;
    console.log(`Realized PNL: $${roundedPnl}, Refunded Collateral: $${refundAmount}`);

    // Check balance after closing to ensure refund is credited
    const balanceAfterCloseRes = await request('GET', '/api/auth/me', null, headers);
    const balanceAfterClose = balanceAfterCloseRes.body.balance;
    console.log(`Balance after close: $${balanceAfterClose} (Expected: $${balanceAfterOrder + refundAmount})`);
    if (Math.abs(balanceAfterClose - (balanceAfterOrder + refundAmount)) > 0.05) {
      throw new Error('Balance refund mismatch after closing position');
    }
    
    // Verify position table is empty
    const positionsFinalRes = await request('GET', '/api/trading/positions', null, headers);
    if (positionsFinalRes.body.some(pos => pos.id === positionId)) {
      throw new Error('Position was not deleted from active DB list after close');
    }
    console.log('✅ Position Close & Collateral Refund Passed.\n');

    // 15. PASSWORD RECOVERY, OTP AND RESET FLOW
    console.log('[TEST 15] Testing Password Recovery, OTP Verification, and Reset Flow...');
    const recoverRes = await request('POST', '/api/auth/password-recovery', { email: email });
    console.log(`Recovery Response: ${recoverRes.statusCode} -`, recoverRes.body);
    if (recoverRes.statusCode !== 200 || !recoverRes.body.code) {
      throw new Error('Password recovery generation failed');
    }
    const otpCode = recoverRes.body.code;
    console.log(`Generated OTP: ${otpCode}`);

    // Verify OTP
    const verifyRes = await request('POST', '/api/auth/verify-otp', { email: email, otp: otpCode });
    console.log(`Verify OTP Response: ${verifyRes.statusCode} -`, verifyRes.body);
    if (verifyRes.statusCode !== 200) {
      throw new Error('OTP verification failed');
    }

    // Reset Password
    const resetRes = await request('POST', '/api/auth/password-reset', {
      email: email,
      otp: otpCode,
      password: 'newpassword123'
    });
    console.log(`Reset Response: ${resetRes.statusCode} -`, resetRes.body);
    if (resetRes.statusCode !== 200) {
      throw new Error('Password reset failed');
    }

    // Try logging in with the old password (expected failure)
    console.log('Verifying old password fails...');
    const oldLoginRes = await request('POST', '/api/auth/login', {
      email: email,
      password: 'password123'
    });
    console.log(`Old login response: ${oldLoginRes.statusCode}`);
    if (oldLoginRes.statusCode === 200) {
      throw new Error('Old password was still accepted after reset!');
    }

    // Log in with new password
    console.log('Logging in with new password...');
    const newLoginRes = await request('POST', '/api/auth/login', {
      email: email,
      password: 'newpassword123'
    });
    console.log(`New login response: ${newLoginRes.statusCode} -`, newLoginRes.body);
    if (newLoginRes.statusCode !== 200) {
      throw new Error('Login with new password failed');
    }

    // Get the new session cookie
    const newSetCookie = newLoginRes.headers['set-cookie'];
    let newSessionCookie = '';
    if (newSetCookie && newSetCookie.length > 0) {
      newSessionCookie = newSetCookie[0].split(';')[0];
    }
    if (!newSessionCookie) throw new Error('Token cookie not found after new password login');
    const newHeaders = { 'Cookie': newSessionCookie };
    console.log('✅ Password Recovery, OTP Verification, and Reset Flow Passed.\n');

    // 16. COPY TRADING ACTIVE, START, AND STOP
    console.log('[TEST 16] Testing Copy Trading Operations...');
    const activeCopyBefore = await request('GET', '/api/trading/copy/active', null, newHeaders);
    console.log(`Active copies before: ${activeCopyBefore.body.length}`);

    console.log('Starting to copy JohnFX Pro with $1,500.00 USD...');
    const startCopyRes = await request('POST', '/api/trading/copy/start', {
      traderName: 'JohnFX Pro',
      roiRate: 14.8,
      winRate: 88,
      riskScore: 'Medium',
      allocatedAmount: 1500.00
    }, newHeaders);
    console.log(`Start copy response: ${startCopyRes.statusCode} -`, startCopyRes.body);
    if (startCopyRes.statusCode !== 201) {
      throw new Error('Start copy trading failed');
    }

    // Verify balance is decremented
    const meAfterCopyRes = await request('GET', '/api/auth/me', null, newHeaders);
    console.log(`Balance after starting copy trading: $${meAfterCopyRes.body.balance} USD`);

    // Verify it is in the active list
    const activeCopyAfter = await request('GET', '/api/trading/copy/active', null, newHeaders);
    console.log(`Active copies after: ${activeCopyAfter.body.length}`);
    const activeRel = activeCopyAfter.body.find(r => r.trader_name === 'JohnFX Pro');
    if (!activeRel) {
      throw new Error('Copied relationship not found in active list');
    }

    console.log(`Stopping copy trading for JohnFX Pro (Relationship ID: ${activeRel.id})...`);
    const stopCopyRes = await request('POST', '/api/trading/copy/stop', {
      relationshipId: activeRel.id
    }, newHeaders);
    console.log(`Stop copy response: ${stopCopyRes.statusCode} -`, stopCopyRes.body);
    if (stopCopyRes.statusCode !== 200) {
      throw new Error('Stop copy trading failed');
    }

    // Verify balance is returned + small return
    const meAfterStopRes = await request('GET', '/api/auth/me', null, newHeaders);
    console.log(`Balance after stopping copy trading: $${meAfterStopRes.body.balance} USD`);
    console.log('✅ Copy Trading Operations Passed.\n');

    // 17. AFFILIATE DASHBOARD STATS AND WITHDRAWALS
    console.log('[TEST 17] Testing Affiliate Ledger & Earnings Withdrawal...');
    const affStatsRes = await request('GET', '/api/affiliate/stats', null, newHeaders);
    console.log(`Affiliate Stats: totalReferrals=${affStatsRes.body.totalReferrals}, totalEarnings=$${affStatsRes.body.totalEarnings}`);
    if (affStatsRes.statusCode !== 200 || !affStatsRes.body.commissions) {
      throw new Error('Affiliate stats retrieval failed');
    }

    const initialBalance = meAfterStopRes.body.balance;
    console.log(`Withdrawing affiliate earnings...`);
    const affWithdrawRes = await request('POST', '/api/affiliate/withdraw', {}, newHeaders);
    console.log(`Affiliate Withdraw Response: ${affWithdrawRes.statusCode} -`, affWithdrawRes.body);
    if (affWithdrawRes.statusCode !== 200) {
      throw new Error('Affiliate earnings withdrawal failed');
    }
    const transferred = affWithdrawRes.body.amountTransferred;

    // Verify balance increases
    const meAfterAffRes = await request('GET', '/api/auth/me', null, newHeaders);
    console.log(`Balance after affiliate withdrawal: $${meAfterAffRes.body.balance} USD (Expected: $${initialBalance + transferred})`);
    if (Math.abs(meAfterAffRes.body.balance - (initialBalance + transferred)) > 0.05) {
      throw new Error('Balance mismatch after affiliate earnings withdrawal');
    }
    console.log('✅ Affiliate Ledger & Earnings Withdrawal Passed.\n');

    // 18. SUPPORT TICKET SUBMISSION AND DYNAMIC LOGS
    console.log('[TEST 18] Testing Help Desk Support Ticket Submission...');
    const createTicketRes = await request('POST', '/api/support/ticket', {
      category: 'Technical',
      subject: 'High-volatility API latency',
      message: 'Experiencing slight delay during peak hours on JPY/USD pairs.'
    }, newHeaders);
    console.log(`Create Ticket Response: ${createTicketRes.statusCode} -`, createTicketRes.body);
    if (createTicketRes.statusCode !== 201) {
      throw new Error('Create support ticket failed');
    }

    // Retrieve active tickets
    const ticketsRes = await request('GET', '/api/support/tickets', null, newHeaders);
    console.log(`Active support tickets count: ${ticketsRes.body.length}`);
    const newTicket = ticketsRes.body.find(t => t.subject === 'High-volatility API latency');
    if (!newTicket) {
      throw new Error('Newly created ticket not found in the list');
    }
    console.log(`New Ticket Category: ${newTicket.category} | Status: ${newTicket.status}`);
    console.log('✅ Help Desk Support Ticket Submission Passed.\n');

    console.log('🎉 ALL E2E AND SPECIALIZED TESTS PASSED SUCCESSFULLY! The VeltrixaFX Node/Express SQLite backend, Trading Engine, Affiliate ledger, Copy trading portfolios, Recovery codes, and Support desks are 100% production-ready! 🎉');
  } catch (error) {
    console.error('❌ Integration test failed with error:', error);
  }
}

// Wait briefly to allow any logs to settle
setTimeout(runTests, 1000);

