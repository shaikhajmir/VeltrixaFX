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

    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! The VeltrixaFX Node/Express SQLite backend is fully verified and 100% functional! 🎉');
  } catch (error) {
    console.error('❌ Integration test failed with error:', error);
  }
}

// Wait briefly to allow any logs to settle
setTimeout(runTests, 1000);
