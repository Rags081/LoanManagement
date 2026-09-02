/**
 * Settings & System Preferences Module Test Suite
 * Validates:
 * 1. Default settings initialization and retrieval
 * 2. Bulk settings update & typed coercion (numbers, booleans, strings, json)
 * 3. System diagnostics & connection health stats
 * 4. Full JSON database backup generation
 * 5. Password change with bcrypt verification
 * 6. Reset to factory defaults
 */
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { settingsRepository } from '../netlify/functions/_lib/repositories/settings.repository.js';
import { userRepository } from '../netlify/functions/_lib/repositories/user.repository.js';

dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'loan_management',
};

async function runSettingsTests() {
  console.log('🧪 Starting Settings & Preferences Module Test Suite...\n');
  const conn = await mysql.createConnection(DB_CONFIG);

  try {
    // ------------------------------------------------------------------
    // TEST 1: Retrieve All Settings
    // ------------------------------------------------------------------
    console.log('--- Test 1: Fetch All System Settings ---');
    const allSettings = await settingsRepository.getAll(conn);
    console.log('Retrieved Settings Keys:', Object.keys(allSettings).length);
    console.log('Sample Preferences:', {
      appName: allSettings.app_name,
      currency: allSettings.currency_symbol,
      rate: allSettings.default_interest_rate,
      allocation: allSettings.payment_allocation_method,
    });

    if (!allSettings.currency_symbol || allSettings.currency_symbol !== '₹') {
      throw new Error('Default currency symbol mismatch');
    }
    if (typeof allSettings.default_interest_rate !== 'number') {
      throw new Error('default_interest_rate is not typed as number');
    }
    console.log('✔ Test 1 passed: All settings retrieved and typed properly.');

    // ------------------------------------------------------------------
    // TEST 2: Update Settings (Bulk Set)
    // ------------------------------------------------------------------
    console.log('\n--- Test 2: Update Settings ---');
    const updatePayload = {
      app_name: 'SmartLend Enterprise Test',
      company_name: 'Test Lending Corp',
      default_interest_rate: 4.5,
      payment_allocation_method: 'interest_first',
      enable_overdue_interest: true,
      grace_period_days: 5,
    };

    await settingsRepository.setMany(updatePayload, 1, conn);

    const updatedSettings = await settingsRepository.getAll(conn);
    console.log('Updated Settings Check:', {
      appName: updatedSettings.app_name,
      rate: updatedSettings.default_interest_rate,
      allocation: updatedSettings.payment_allocation_method,
      enableOverdue: updatedSettings.enable_overdue_interest,
      gracePeriod: updatedSettings.grace_period_days,
    });

    if (updatedSettings.app_name !== 'SmartLend Enterprise Test') throw new Error('app_name not updated');
    if (updatedSettings.default_interest_rate !== 4.5) throw new Error('default_interest_rate not updated');
    if (updatedSettings.payment_allocation_method !== 'interest_first') throw new Error('payment_allocation_method not updated');
    if (updatedSettings.enable_overdue_interest !== true) throw new Error('enable_overdue_interest not updated');
    if (updatedSettings.grace_period_days !== 5) throw new Error('grace_period_days not updated');
    console.log('✔ Test 2 passed: Settings updated and persisted successfully.');

    // ------------------------------------------------------------------
    // TEST 3: System Diagnostics & Health Check
    // ------------------------------------------------------------------
    console.log('\n--- Test 3: System Diagnostics & Table Counts ---');
    const systemInfo = await settingsRepository.getSystemInfo(conn);
    console.log('System Info:', systemInfo);

    if (systemInfo.status !== 'healthy') throw new Error('System status not healthy');
    if (typeof systemInfo.pingMs !== 'number') throw new Error('Ping MS not a number');
    if (!systemInfo.tableCounts || typeof systemInfo.tableCounts.loans !== 'number') {
      throw new Error('Table counts missing');
    }
    console.log('✔ Test 3 passed: System diagnostics and health metrics verified.');

    // ------------------------------------------------------------------
    // TEST 4: Full Database Backup Export
    // ------------------------------------------------------------------
    console.log('\n--- Test 4: Database Backup Generation ---');
    const backup = await settingsRepository.getFullDatabaseBackup(conn);
    console.log('Backup Metadata:', backup.metadata);
    console.log('Backup Table Rows:', {
      borrowers: backup.borrowers?.length,
      loans: backup.loans?.length,
      payments: backup.payments?.length,
      capital: backup.capitalTransactions?.length,
      settings: backup.settings?.length,
    });

    if (!backup.metadata || !backup.borrowers || !backup.loans || !backup.settings) {
      throw new Error('Incomplete backup structure');
    }
    console.log('✔ Test 4 passed: Full database backup generated successfully.');

    // ------------------------------------------------------------------
    // TEST 5: Password Change & Bcrypt Verification
    // ------------------------------------------------------------------
    console.log('\n--- Test 5: Password Change Logic ---');
    const testAdmin = await userRepository.findByEmail('admin@loanmanagement.com', conn);
    if (!testAdmin) throw new Error('Default admin user (admin@loanmanagement.com) not found');

    const isCurrentValid = await bcrypt.compare('Admin@123', testAdmin.password_hash);
    if (!isCurrentValid) throw new Error('Initial admin password comparison failed');

    // Hash new password and test update
    const newPasswordHash = await bcrypt.hash('Admin@2026Secure!', 10);
    await userRepository.update(testAdmin.id, { password_hash: newPasswordHash }, conn);

    const reloadedAdmin = await userRepository.findById(testAdmin.id, conn);
    const isNewValid = await bcrypt.compare('Admin@2026Secure!', reloadedAdmin.password_hash);
    if (!isNewValid) throw new Error('New password verification failed');

    // Restore original default password for development
    const originalHash = await bcrypt.hash('Admin@123', 10);
    await userRepository.update(testAdmin.id, { password_hash: originalHash }, conn);
    console.log('✔ Test 5 passed: Password change, bcrypt hashing, and verification passed.');

    // ------------------------------------------------------------------
    // TEST 6: Reset Settings to Factory Defaults
    // ------------------------------------------------------------------
    console.log('\n--- Test 6: Reset Settings to Factory Defaults ---');
    await settingsRepository.resetToDefaults(1, conn);
    const resetSettings = await settingsRepository.getAll(conn);

    console.log('Reset Preferences Check:', {
      appName: resetSettings.app_name,
      rate: resetSettings.default_interest_rate,
      allocation: resetSettings.payment_allocation_method,
      gracePeriod: resetSettings.grace_period_days,
    });

    if (resetSettings.app_name !== 'SmartLend Portfolio Manager') throw new Error('Reset failed for app_name');
    if (resetSettings.payment_allocation_method !== 'principal_first') throw new Error('Reset failed for payment_allocation_method');
    if (resetSettings.grace_period_days !== 0) throw new Error('Reset failed for grace_period_days');
    console.log('✔ Test 6 passed: Settings successfully restored to factory defaults.');

  } finally {
    await conn.end();
  }

  console.log('\n================================================================');
  console.log('🎉 ALL SETTINGS & SYSTEM PREFERENCES TESTS PASSED (100%)!');
  console.log('================================================================');
}

runSettingsTests().catch((err) => {
  console.error('\n❌ Settings Test Suite Failed:', err);
  process.exit(1);
});
