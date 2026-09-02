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

// Isolated implementation of calculateOutstanding to test logic
function calculateCalendarTenure(
  startDateStr,
  endDateStr = new Date()
) {
  if (!startDateStr) {
    return { years: 0, months: 0, days: 0, totalDays: 0, formatted: '0 days' };
  }

  const startClean = typeof startDateStr === 'string'
    ? startDateStr.split('T')[0].split(' ')[0]
    : startDateStr.toISOString().split('T')[0];

  const endClean = !endDateStr
    ? new Date().toISOString().split('T')[0]
    : typeof endDateStr === 'string'
    ? endDateStr.split('T')[0].split(' ')[0]
    : endDateStr.toISOString().split('T')[0];

  const [y1, m1, d1] = startClean.split('-').map(Number);
  const [y2, m2, d2] = endClean.split('-').map(Number);

  const start = new Date(y1, m1 - 1, d1, 12, 0, 0);
  const end = new Date(y2, m2 - 1, d2, 12, 0, 0);

  if (end < start) {
    return { years: 0, months: 0, days: 0, totalDays: 0, formatted: '0 days' };
  }

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

async function testCanonicalOutstanding() {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    const [loans] = await conn.query(`
      SELECT * FROM loans WHERE deleted_at IS NULL
    `);

    console.log('=== CHECKING ALL LOANS ===');
    for (const loan of loans) {
      const [payments] = await conn.query(
        'SELECT * FROM payments WHERE loan_id = ? AND is_void = FALSE ORDER BY payment_date ASC, id ASC',
        [loan.id]
      );

      const originalPrincipal = Number(loan.principal_amount || 0);
      const rate = Number(loan.interest_rate || 0);
      const rateType = loan.interest_rate_type || 'monthly';
      const loanGivenDateStr = String(loan.loan_given_date instanceof Date ? loan.loan_given_date.toISOString() : loan.loan_given_date).split('T')[0];

      let totalPrincipalPaid = 0;
      let totalInterestPaid = 0;
      let totalReceived = 0;
      let settlementPaymentDate = null;

      for (const p of payments) {
        const pAmount = Number(p.payment_amount || 0);
        const pPrincipal = Number(p.principal_portion || 0);
        const pInterest = Number(p.interest_portion || 0);
        const pDate = String(p.payment_date).split('T')[0];

        totalPrincipalPaid += pPrincipal;
        totalInterestPaid += pInterest;
        totalReceived += pAmount;

        if (originalPrincipal - totalPrincipalPaid <= 0) {
          settlementPaymentDate = pDate;
        }
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const activePrincipal = Math.max(0, originalPrincipal - totalPrincipalPaid);
      const isAlreadySettled = loan.status === 'completed' || (activePrincipal === 0 && totalInterestPaid > 0);
      const rawSettlement = loan.settlement_date;
      const settlementDate = rawSettlement
        ? (rawSettlement instanceof Date ? rawSettlement.toISOString().split('T')[0] : String(rawSettlement).split('T')[0])
        : isAlreadySettled
        ? (settlementPaymentDate || todayStr)
        : null;

      const endDateStr = isAlreadySettled && settlementDate ? settlementDate : todayStr;
      const tenureResult = calculateCalendarTenure(loanGivenDateStr, endDateStr);

      let totalAccruedInterest = 0;
      if (rateType === 'flat') {
        // FORMULA: Principal Amount * Interest Rate / 100
        totalAccruedInterest = Math.round((originalPrincipal * (rate / 100)) * 100) / 100;
      } else if (rateType === 'daily') {
        let curPrincipal = originalPrincipal;
        let lastDate = loanGivenDateStr;
        let dailySum = 0;

        for (const p of payments) {
          const pDate = String(p.payment_date).split('T')[0];
          const diffDays = Math.max(0, Math.round((new Date(pDate).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)));
          const dailyRate = (rate / 100) / 30;
          dailySum += curPrincipal * dailyRate * diffDays;
          curPrincipal = Math.max(0, curPrincipal - Number(p.principal_portion || 0));
          lastDate = pDate;
        }

        const diffFinal = Math.max(0, Math.round((new Date(endDateStr).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)));
        const dailyRate = (rate / 100) / 30;
        dailySum += curPrincipal * dailyRate * diffFinal;
        totalAccruedInterest = Math.round(dailySum * 100) / 100;
      } else {
        // Monthly
        let totalCycles = tenureResult.years * 12 + tenureResult.months;
        if (tenureResult.days > 0) totalCycles += 1;
        if (totalCycles === 0 && tenureResult.totalDays > 0) totalCycles = 1;

        let monthlySum = 0;
        const [startY, startM, startD] = loanGivenDateStr.split('-').map(Number);

        for (let c = 0; c < totalCycles; c++) {
          const cycleEndDate = new Date(startY, (startM - 1) + (c + 1), startD, 12, 0, 0).toISOString().split('T')[0];

          let princPaidBeforeCycle = 0;
          for (const p of payments) {
            const pDate = String(p.payment_date).split('T')[0];
            if (pDate <= cycleEndDate) {
              princPaidBeforeCycle += Number(p.principal_portion || 0);
            }
          }

          const activeInCycle = Math.max(0, originalPrincipal - princPaidBeforeCycle);
          monthlySum += activeInCycle * (rate / 100);
        }

        if (totalInterestPaid > monthlySum && totalCycles === 1) {
          monthlySum = totalInterestPaid;
        }

        totalAccruedInterest = Math.round(monthlySum * 100) / 100;
      }

      const interestDue = Math.max(0, totalAccruedInterest - totalInterestPaid);
      const principalOutstanding = activePrincipal;
      const interestOutstanding = interestDue;
      const totalOutstanding = principalOutstanding + interestOutstanding;

      console.log(`Loan ${loan.loan_id} [${loan.status}]: Principal: ₹${originalPrincipal}, Rate: ${rate}% (${rateType}) => Princ Due: ₹${principalOutstanding}, Int Due: ₹${interestOutstanding}, Total: ₹${totalOutstanding}`);
    }

  } finally {
    await conn.end();
  }
}

testCanonicalOutstanding().catch(console.error);
