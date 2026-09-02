import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'loan_management',
};

async function verifyLoansTableApi() {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    const { loanRepository } = await import('../netlify/functions/_lib/repositories/loan.repository.ts');

    const result = await loanRepository.findAll({}, conn);
    console.log(`=== LOANS TABLE DATA (${result.total} total loans) ===\n`);

    for (const loan of result.data) {
      console.log(`Loan: ${loan.loanId} [${loan.status}]`);
      console.log(`  Principal: ₹${loan.principalAmount}`);
      console.log(`  Principal Received: ₹${loan.principalReceived}`);
      console.log(`  Interest Received: ₹${loan.interestReceived}`);
      console.log(`  Interest Payment Details count: ${loan.interestPaymentDetails?.length || 0}`);
      if (loan.interestPaymentDetails && loan.interestPaymentDetails.length > 0) {
        console.log('  Individual Interest Payments:');
        for (const d of loan.interestPaymentDetails) {
          console.log(`    - ID: ${d.id}, Date: ${d.paymentDate}, Interest: ₹${d.interestPortion}, Amount: ₹${d.paymentAmount}`);
        }
      }
      console.log('----------------------------------------------------');
    }

  } finally {
    await conn.end();
  }
}

verifyLoansTableApi().catch(console.error);
