import axios from 'axios';
import dotenv from 'dotenv';
import { generateToken } from '../netlify/functions/_lib/auth-utils.js';

dotenv.config();

async function testSettingsApi() {
  console.log('Testing Settings Netlify Function HTTP endpoint...');

  // Generate valid admin JWT token
  const token = generateToken({
    id: 1,
    email: 'admin@loanmanagement.com',
    role: 'admin',
  });

  const client = axios.create({
    baseURL: 'http://localhost:5173/api',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  // 1. GET /api/settings
  const getRes = await client.get('/settings');
  console.log('GET /api/settings response status:', getRes.status);
  console.log('Fetched App Name:', getRes.data.app_name);

  // 2. PUT /api/settings
  const putRes = await client.put('/settings', {
    app_name: 'SmartLend Pro',
    company_name: 'SmartLend Global Inc.',
    default_interest_rate: 3.5,
    currency_symbol: '₹',
    currency_format: 'INR',
    date_format: 'DD-MMM-YYYY',
    payment_allocation_method: 'principal_first',
    enable_overdue_interest: false,
    grace_period_days: 2,
    borrower_id_prefix: 'BOR',
    loan_id_prefix: 'LN',
    payment_id_prefix: 'PAY',
    capital_id_prefix: 'CAP',
  });

  console.log('PUT /api/settings response status:', putRes.status);
  console.log('PUT /api/settings response body:', putRes.data);

  if (!putRes.data.success) {
    throw new Error('PUT /api/settings did not return success: true');
  }

  // 3. GET /api/settings/system-info
  const infoRes = await client.get('/settings/system-info');
  console.log('GET /api/settings/system-info response status:', infoRes.status);
  console.log('System Info:', infoRes.data);

  console.log('\n✔ Settings API endpoint test PASSED with 0 errors!');
}

testSettingsApi().catch((err) => {
  console.error('Settings API test failed:', err.response?.data || err.message);
  process.exit(1);
});
