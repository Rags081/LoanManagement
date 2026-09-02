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

async function testMultiplePayments() {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    const { loanRepository } = await import('../netlify/functions/_lib/repositories/loan.repository.ts');
    
    // Check LN-002 details
    const loan = await loanRepository.findByLoanId('LN-002', conn);
    console.log('LN-002 mapped loan details:', {
      loanId: loan?.loanId,
      principalReceived: loan?.principalReceived,
      interestReceived: loan?.interestReceived,
      interestPaymentDetails: loan?.interestPaymentDetails,
    });
  } finally {
    await conn.end();
  }
}

testMultiplePayments().catch(console.error);
