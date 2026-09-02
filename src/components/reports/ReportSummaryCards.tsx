import React from 'react';
import Card from '@/components/common/Card';
import { ReportType } from '@/types/report';
import { formatCurrency } from '@/utils/formatters';
import { Landmark, HandCoins, CreditCard, Users, AlertTriangle, TrendingUp } from 'lucide-react';

interface ReportSummaryCardsProps {
  reportType: ReportType;
  data: Record<string, unknown>[];
  isLoading?: boolean;
}

export const ReportSummaryCards: React.FC<ReportSummaryCardsProps> = ({
  reportType,
  data,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 animate-pulse bg-slate-50 border border-slate-200">
            <div className="h-3.5 bg-slate-200 rounded w-1/3 mb-2" />
            <div className="h-6 bg-slate-300 rounded w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  // Derive cards based on report type
  const renderCards = () => {
    switch (reportType) {
      case 'capital-statement': {
        const totalGiven = data
          .filter((d) => d.transactionType === 'capital_given')
          .reduce((sum, d) => sum + Number(d.amount || 0), 0);
        const totalReturned = data
          .filter((d) => d.transactionType === 'capital_returned')
          .reduce((sum, d) => sum + Number(d.amount || 0), 0);
        const latestBal = data.length > 0 ? Number(data[data.length - 1]?.runningBalance || 0) : 0;

        return [
          { title: 'Total Capital Added', value: formatCurrency(totalGiven), icon: <Landmark className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50 text-emerald-800' },
          { title: 'Total Capital Withdrawn', value: formatCurrency(totalReturned), icon: <Landmark className="w-4 h-4 text-rose-600" />, bg: 'bg-rose-50 text-rose-800' },
          { title: 'Net Capital Pool', value: formatCurrency(latestBal), icon: <Landmark className="w-4 h-4 text-indigo-600" />, bg: 'bg-indigo-50 text-indigo-800' },
          { title: 'Total Transactions', value: String(data.length), icon: <Landmark className="w-4 h-4 text-slate-600" />, bg: 'bg-slate-50 text-slate-800' },
        ];
      }

      case 'loan-report': {
        const totalLent = data.reduce((sum, d) => sum + Number(d.principalAmount || 0), 0);
        const totalCollected = data.reduce((sum, d) => sum + Number(d.totalReceived || 0), 0);
        const totalOutstanding = data.reduce((sum, d) => sum + Number(d.totalOutstanding || 0), 0);
        const activeCount = data.filter((d) => d.status === 'active' || d.status === 'overdue').length;

        return [
          { title: 'Total Loans Disbursed', value: formatCurrency(totalLent), icon: <HandCoins className="w-4 h-4 text-indigo-600" />, bg: 'bg-indigo-50 text-indigo-800' },
          { title: 'Total Collected', value: formatCurrency(totalCollected), icon: <CreditCard className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50 text-emerald-800' },
          { title: 'Total Outstanding', value: formatCurrency(totalOutstanding), icon: <AlertTriangle className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-50 text-amber-800' },
          { title: 'Active Accounts', value: `${activeCount} of ${data.length}`, icon: <Users className="w-4 h-4 text-purple-600" />, bg: 'bg-purple-50 text-purple-800' },
        ];
      }

      case 'borrower-report': {
        const totalBorrowers = data.length;
        const totalBorrowed = data.reduce((sum, d) => sum + Number(d.totalBorrowed || 0), 0);
        const totalRepaid = data.reduce((sum, d) => sum + Number(d.totalRepaid || 0), 0);
        const totalDue = data.reduce((sum, d) => sum + Number(d.totalOutstanding || 0), 0);

        return [
          { title: 'Total Registered Borrowers', value: String(totalBorrowers), icon: <Users className="w-4 h-4 text-purple-600" />, bg: 'bg-purple-50 text-purple-800' },
          { title: 'Total Credit Extended', value: formatCurrency(totalBorrowed), icon: <HandCoins className="w-4 h-4 text-indigo-600" />, bg: 'bg-indigo-50 text-indigo-800' },
          { title: 'Total Repaid by Clients', value: formatCurrency(totalRepaid), icon: <CreditCard className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50 text-emerald-800' },
          { title: 'Total Money Pending', value: formatCurrency(totalDue), icon: <AlertTriangle className="w-4 h-4 text-rose-600" />, bg: 'bg-rose-50 text-rose-800' },
        ];
      }

      case 'payment-report': {
        const totalPaid = data.filter((d) => !d.isVoid).reduce((sum, d) => sum + Number(d.paymentAmount || 0), 0);
        const princPortion = data.filter((d) => !d.isVoid).reduce((sum, d) => sum + Number(d.principalPortion || 0), 0);
        const intPortion = data.filter((d) => !d.isVoid).reduce((sum, d) => sum + Number(d.interestPortion || 0), 0);
        const voidCount = data.filter((d) => d.isVoid).length;

        return [
          { title: 'Total Money Collected', value: formatCurrency(totalPaid), icon: <CreditCard className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50 text-emerald-800' },
          { title: 'Principal Recovered', value: formatCurrency(princPortion), icon: <CreditCard className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-50 text-blue-800' },
          { title: 'Interest Profit Earned', value: formatCurrency(intPortion), icon: <TrendingUp className="w-4 h-4 text-indigo-600" />, bg: 'bg-indigo-50 text-indigo-800' },
          { title: 'Valid Payments (Void: ' + voidCount + ')', value: `${data.length - voidCount} Txns`, icon: <CreditCard className="w-4 h-4 text-slate-600" />, bg: 'bg-slate-50 text-slate-800' },
        ];
      }

      case 'outstanding-report': {
        const princDue = data.reduce((sum, d) => sum + Number(d.principalOutstanding || 0), 0);
        const intDue = data.reduce((sum, d) => sum + Number(d.interestOutstanding || 0), 0);
        const totalDue = data.reduce((sum, d) => sum + Number(d.totalOutstanding || 0), 0);

        return [
          { title: 'Total Money Pending', value: formatCurrency(totalDue), icon: <AlertTriangle className="w-4 h-4 text-rose-600" />, bg: 'bg-rose-50 text-rose-800' },
          { title: 'Principal Pending', value: formatCurrency(princDue), icon: <HandCoins className="w-4 h-4 text-indigo-600" />, bg: 'bg-indigo-50 text-indigo-800' },
          { title: 'Interest Pending', value: formatCurrency(intDue), icon: <TrendingUp className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-50 text-amber-800' },
          { title: 'Outstanding Accounts', value: `${data.length} Loans`, icon: <Users className="w-4 h-4 text-slate-600" />, bg: 'bg-slate-50 text-slate-800' },
        ];
      }

      case 'overdue-report': {
        const totalOverdue = data.reduce((sum, d) => sum + Number(d.totalOutstanding || 0), 0);
        const maxDays = data.length > 0 ? Math.max(...data.map((d) => Number(d.daysOverdue || 0))) : 0;

        return [
          { title: 'Total Overdue Balance', value: formatCurrency(totalOverdue), icon: <AlertTriangle className="w-4 h-4 text-rose-600" />, bg: 'bg-rose-50 text-rose-800' },
          { title: 'Overdue Accounts', value: `${data.length} Accounts`, icon: <AlertTriangle className="w-4 h-4 text-rose-600" />, bg: 'bg-rose-50 text-rose-800' },
          { title: 'Max Days Overdue', value: `${maxDays} Days`, icon: <AlertTriangle className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-50 text-amber-800' },
          { title: 'Action Required', value: 'Immediate Follow-up', icon: <AlertTriangle className="w-4 h-4 text-indigo-600" />, bg: 'bg-indigo-50 text-indigo-800' },
        ];
      }

      case 'interest-report': {
        const expected = data.reduce((sum, d) => sum + Number(d.expectedInterest || 0), 0);
        const realized = data.reduce((sum, d) => sum + Number(d.realizedInterest || 0), 0);
        const pending = data.reduce((sum, d) => sum + Number(d.pendingInterest || 0), 0);

        return [
          { title: 'Total Expected Interest', value: formatCurrency(expected), icon: <TrendingUp className="w-4 h-4 text-indigo-600" />, bg: 'bg-indigo-50 text-indigo-800' },
          { title: 'Realized Interest Profit', value: formatCurrency(realized), icon: <TrendingUp className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50 text-emerald-800' },
          { title: 'Interest Left to Collect', value: formatCurrency(pending), icon: <TrendingUp className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-50 text-amber-800' },
          { title: 'Realization Rate', value: `${expected > 0 ? ((realized / expected) * 100).toFixed(1) : 0}%`, icon: <TrendingUp className="w-4 h-4 text-purple-600" />, bg: 'bg-purple-50 text-purple-800' },
        ];
      }

      case 'monthly-collection': {
        const total = data.reduce((sum, d) => sum + Number(d.totalCollected || 0), 0);
        const princ = data.reduce((sum, d) => sum + Number(d.principalCollected || 0), 0);
        const int = data.reduce((sum, d) => sum + Number(d.interestCollected || 0), 0);
        const txns = data.reduce((sum, d) => sum + Number(d.paymentCount || 0), 0);

        return [
          { title: 'Total Collected (Year)', value: formatCurrency(total), icon: <CreditCard className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50 text-emerald-800' },
          { title: 'Principal Recovered', value: formatCurrency(princ), icon: <CreditCard className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-50 text-blue-800' },
          { title: 'Interest Profit Earned', value: formatCurrency(int), icon: <TrendingUp className="w-4 h-4 text-indigo-600" />, bg: 'bg-indigo-50 text-indigo-800' },
          { title: 'Total Repayments Recorded', value: `${txns} Receipts`, icon: <CreditCard className="w-4 h-4 text-slate-600" />, bg: 'bg-slate-50 text-slate-800' },
        ];
      }
    }
  };

  const cards = renderCards();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
      {cards.map((c, i) => (
        <Card key={i} className="p-4 border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{c.title}</span>
            <div className={`p-2 rounded-xl ${c.bg}`}>{c.icon}</div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2 tracking-tight">{c.value}</p>
        </Card>
      ))}
    </div>
  );
};

export default ReportSummaryCards;
