import dotenv from 'dotenv';
import dns from 'dns';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore
}

dotenv.config();

import { checkDatabaseHealth } from '../netlify/functions/_lib/db';
import {
  dashboardRepository,
  borrowerRepository,
  loanRepository,
  paymentRepository,
  capitalRepository,
  settingsRepository,
} from '../netlify/functions/_lib/repositories';

async function main() {
  console.log('================================================================');
  console.log('        TESTING ACTIVE DB_DRIVER=mongodb REPOSITORIES & HEALTH');
  console.log('================================================================\n');

  console.log(`Active DB Driver: ${process.env.DB_DRIVER}`);

  // 1. Health check
  const health = await checkDatabaseHealth();
  console.log('\n1. Database Health Check:');
  console.log(JSON.stringify(health, null, 2));

  if (health.status !== 'ok' || health.driver !== 'mongodb') {
    throw new Error(`Health check failed: expected status=ok and driver=mongodb, got ${JSON.stringify(health)}`);
  }

  // 2. Dashboard metrics
  const dash = await dashboardRepository.getAllMetrics();
  console.log('\n2. Live Dashboard Metrics (from MongoDB):');
  console.log(`  Capital Current Balance: ₹${dash.capital.currentBalance}`);
  console.log(`  Total Lent             : ₹${dash.loans.totalLent}`);
  console.log(`  Principal Received     : ₹${dash.collections.totalPrincipalReceived}`);
  console.log(`  Interest Received      : ₹${dash.collections.totalInterestReceived}`);
  console.log(`  Expected Interest      : ₹${dash.profit.expectedInterest}`);
  console.log(`  Realized Interest      : ₹${dash.profit.realizedInterest}`);
  console.log(`  Pending Interest       : ₹${dash.profit.pendingInterest}`);
  console.log(`  Registered Borrowers   : ${dash.registeredBorrowersCount}`);

  // 3. Borrowers
  const borrowers = await borrowerRepository.findAll();
  console.log(`\n3. Borrowers List: ${borrowers.total} total borrowers returned.`);

  // 4. Loans
  const loans = await loanRepository.findAll();
  console.log(`\n4. Loans List: ${loans.total} total loans returned.`);

  // 5. Payments
  const payments = await paymentRepository.findAll();
  console.log(`\n5. Payments List: ${payments.total} total payments returned.`);

  // 6. Capital
  const capital = await capitalRepository.getBalance();
  console.log(`\n6. Capital Balance: ₹${capital.currentBalance} across ${capital.transactionCount} transactions.`);

  // 7. Settings
  const settings = await settingsRepository.getAll();
  console.log(`\n7. Settings Store: App Name = "${settings.app_name}", Interest Type = "${settings.interest_calculation_type}"`);

  console.log('\n================================================================');
  console.log('✓ ALL MONGODB REPOSITORIES & HEALTH CHECK OPERATIONAL');
  console.log('================================================================\n');
}

main().catch((err) => {
  console.error('[FATAL ERROR] Live test failed:', err);
  process.exit(1);
});
