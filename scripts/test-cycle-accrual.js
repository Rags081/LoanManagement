import mysql from 'mysql2/promise';
import Decimal from 'decimal.js';
import dotenv from 'dotenv';
dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'loan_management',
};

function calculateCalendarTenure(startDateStr, endDateStr) {
  if (!startDateStr) return { years: 0, months: 0, days: 0, totalDays: 0, formatted: '0 days' };
  const startClean = String(startDateStr instanceof Date ? startDateStr.toISOString() : startDateStr).split('T')[0].split(' ')[0];
  const endClean = !endDateStr
    ? new Date().toISOString().split('T')[0]
    : String(endDateStr instanceof Date ? endDateStr.toISOString() : endDateStr).split('T')[0].split(' ')[0];

  const [y1, m1, d1] = startClean.split('-').map(Number);
  const [y2, m2, d2] = endClean.split('-').map(Number);

  const start = new Date(y1, m1 - 1, d1, 12, 0, 0);
  const end = new Date(y2, m2 - 1, d2, 12, 0, 0);

  if (end < start) return { years: 0, months: 0, days: 0, totalDays: 0, formatted: '0 days' };

  let years = y2 - y1;
  let months = (m2 - 1) - (m1 - 1);
  let days = d2 - d1;

  if (days < 0) {
    const prevMonthLastDay = new Date(y2, m2 - 1, 0).getDate();
    days += prevMonthLastDay;
    months -= 1;
  }

  if (months < 0) {
    months += 12;
    years -= 1;
  }

  const diffMs = end.getTime() - start.getTime();
  const totalDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  return { years, months, days, totalDays };
}

function calculateLoanOutstandingCycleAware(loan, payments, evalDateStr = new Date().toISOString().split('T')[0]) {
  const originalPrincipal = Number(loan.principal_amount);
  const rate = Number(loan.interest_rate);
  const rateType = loan.interest_rate_type || 'monthly';
  const startDateStr = String(loan.loan_given_date instanceof Date ? loan.loan_given_date.toISOString() : loan.loan_given_date).split('T')[0];

  const validPayments = payments
    .filter(p => !p.is_void && String(p.payment_date).split('T')[0] <= evalDateStr)
    .sort((a, b) => (a.payment_date > b.payment_date ? 1 : -1));

  let totalPrincipalPaid = 0;
  let totalInterestPaid = 0;
  for (const p of validPayments) {
    totalPrincipalPaid += Number(p.principal_portion || 0);
    totalInterestPaid += Number(p.interest_portion || 0);
  }

  const principalOutstanding = Math.max(0, originalPrincipal - totalPrincipalPaid);

  let accruedInterest = 0;

  if (rateType === 'flat') {
    accruedInterest = Number(loan.total_expected_interest || (originalPrincipal * rate / 100));
  } else if (rateType === 'daily') {
    // Daily calculation
    let currentPrincipal = originalPrincipal;
    let lastDate = startDateStr;
    let totalInt = 0;

    for (const p of validPayments) {
      const pDate = String(p.payment_date).split('T')[0];
      const diffDays = Math.max(0, Math.round((new Date(pDate).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)));
      const dailyRate = (rate / 100) / 30;
      totalInt += currentPrincipal * dailyRate * diffDays;
      currentPrincipal = Math.max(0, currentPrincipal - Number(p.principal_portion || 0));
      lastDate = pDate;
    }

    const diffDaysFinal = Math.max(0, Math.round((new Date(evalDateStr).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)));
    const dailyRate = (rate / 100) / 30;
    totalInt += currentPrincipal * dailyRate * diffDaysFinal;
    accruedInterest = Math.round(totalInt * 100) / 100;
  } else {
    // Monthly Standard (Full Month Billing Cycles)
    const tenure = calculateCalendarTenure(startDateStr, evalDateStr);
    let totalCycles = tenure.years * 12 + tenure.months;
    if (tenure.days > 0) totalCycles += 1;
    if (totalCycles === 0 && tenure.totalDays > 0) totalCycles = 1;

    // For each monthly cycle, determine the active principal during that cycle
    let totalInt = 0;
    const [startY, startM, startD] = startDateStr.split('-').map(Number);

    for (let c = 0; c < totalCycles; c++) {
      // Cycle c end date is start date + (c + 1) months
      const cycleEndDate = new Date(startY, (startM - 1) + (c + 1), startD, 12, 0, 0).toISOString().split('T')[0];

      // What was the principal paid BEFORE this cycle end date?
      let princPaidBeforeCycle = 0;
      for (const p of validPayments) {
        const pDate = String(p.payment_date).split('T')[0];
        if (pDate <= cycleEndDate) {
          princPaidBeforeCycle += Number(p.principal_portion || 0);
        }
      }

      const activePrincipalInCycle = Math.max(0, originalPrincipal - princPaidBeforeCycle);
      const cycleInterest = activePrincipalInCycle * (rate / 100);
      totalInt += cycleInterest;
    }

    accruedInterest = Math.round(totalInt * 100) / 100;
  }

  const interestOutstanding = Math.max(0, accruedInterest - totalInterestPaid);
  const totalOutstanding = principalOutstanding + interestOutstanding;

  return {
    loanId: loan.loan_id,
    principalOutstanding,
    totalPrincipalPaid,
    accruedInterest,
    totalInterestPaid,
    interestOutstanding,
    totalOutstanding,
  };
}

async function run() {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    const [loans] = await conn.query('SELECT * FROM loans WHERE deleted_at IS NULL');
    const [payments] = await conn.query('SELECT * FROM payments WHERE is_void = FALSE');

    console.log('=== REAL-TIME LOAN RECALCULATION (CYCLE-AWARE) ===');
    for (const l of loans) {
      const loanPayments = payments.filter(p => p.loan_id === l.id);
      const res = calculateLoanOutstandingCycleAware(l, loanPayments, '2026-09-02');
      console.log(res);
    }
  } finally {
    await conn.end();
  }
}

run();
