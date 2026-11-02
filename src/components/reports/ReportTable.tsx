import React, { useState } from 'react';
import Card from '@/components/common/Card';
import { ReportType } from '@/types/report';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { APP_NAME } from '@/utils/constants';
import { ChevronLeft, ChevronRight, FileQuestion } from 'lucide-react';

interface ReportTableProps {
  reportType: ReportType;
  data: Record<string, unknown>[];
  isLoading?: boolean;
}

export const ReportTable: React.FC<ReportTableProps> = ({
  reportType,
  data,
  isLoading = false,
}) => {
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const totalPages = Math.ceil(data.length / pageSize) || 1;
  const paginatedData = data.slice((page - 1) * pageSize, page * pageSize);

  const getStatusBadge = (status: unknown) => {
    const s = String(status).toLowerCase();
    switch (s) {
      case 'active':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800">Active</span>;
      case 'overdue':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-800">Overdue</span>;
      case 'completed':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">Completed</span>;
      case 'true':
      case 'void':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-800">VOID</span>;
      case 'false':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">PAID</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700 capitalize">{String(status)}</span>;
    }
  };

  const renderTableContent = () => {
    switch (reportType) {
      case 'capital-statement':
        return {
          headers: ['Trans ID', 'Date', 'Type', 'Amount (₹)', 'Source / Investor', 'Destination', 'Running Balance (₹)', 'Reference'],
          renderRow: (item: Record<string, unknown>, idx: number) => (
            <tr key={idx} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 text-xs">
              <td className="p-3 font-mono font-semibold text-indigo-600">{String(item.transactionId)}</td>
              <td className="p-3">{formatDate(item.transactionDate as string)}</td>
              <td className="p-3">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  item.transactionType === 'capital_given' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {String(item.transactionType) === 'capital_given' ? 'Inflow' : 'Outflow'}
                </span>
              </td>
              <td className="p-3 font-mono font-bold text-slate-900">{formatCurrency(item.amount as number)}</td>
              <td className="p-3 text-slate-700">{String(item.source || '-')}</td>
              <td className="p-3 text-slate-700">{String(item.destination || '-')}</td>
              <td className="p-3 font-mono font-bold text-indigo-700">{formatCurrency(item.runningBalance as number)}</td>
              <td className="p-3 text-slate-500 font-mono text-[11px]">{String(item.referenceNumber || '-')}</td>
            </tr>
          ),
          renderTotal: () => {
            const totalGiven = data.filter(d => d.transactionType === 'capital_given').reduce((sum, d) => sum + Number(d.amount || 0), 0);
            return (
              <tr className="bg-slate-100/80 font-bold text-xs border-t-2 border-slate-300">
                <td className="p-3" colSpan={3}>TOTAL INFLOW</td>
                <td className="p-3 font-mono text-emerald-700">{formatCurrency(totalGiven)}</td>
                <td className="p-3" colSpan={4}></td>
              </tr>
            );
          },
        };

      case 'loan-report':
        return {
          headers: ['Loan ID', 'Borrower', 'Phone', 'Principal (₹)', 'Rate', 'Disbursed', 'Status', 'Principal Paid (₹)', 'Interest Paid (₹)', 'Total Pending (₹)'],
          renderRow: (item: Record<string, unknown>, idx: number) => (
            <tr key={idx} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 text-xs">
              <td className="p-3 font-mono font-semibold text-indigo-600">{String(item.loanId)}</td>
              <td className="p-3 font-semibold text-slate-900">{String(item.borrowerName)}</td>
              <td className="p-3 font-mono text-slate-500">{String(item.borrowerPhone || '-')}</td>
              <td className="p-3 font-mono font-semibold text-slate-900">{formatCurrency(item.principalAmount as number)}</td>
              <td className="p-3 text-slate-600">{String(item.interestRate)}% / {String(item.interestRateType)}</td>
              <td className="p-3 text-slate-600">{formatDate(item.loanGivenDate as string)}</td>
              <td className="p-3">{getStatusBadge(item.status)}</td>
              <td className="p-3 font-mono text-blue-700 font-medium">{formatCurrency(item.principalReceived as number)}</td>
              <td className="p-3 font-mono text-emerald-700 font-medium">{formatCurrency(item.interestReceived as number)}</td>
              <td className="p-3 font-mono font-black text-rose-700">{formatCurrency(item.totalOutstanding as number)}</td>
            </tr>
          ),
          renderTotal: () => {
            const sumLent = data.reduce((s, d) => s + Number(d.principalAmount || 0), 0);
            const sumPrincPaid = data.reduce((s, d) => s + Number(d.principalReceived || 0), 0);
            const sumIntPaid = data.reduce((s, d) => s + Number(d.interestReceived || 0), 0);
            const sumDue = data.reduce((s, d) => s + Number(d.totalOutstanding || 0), 0);
            return (
              <tr className="bg-slate-100/80 font-bold text-xs border-t-2 border-slate-300">
                <td className="p-3" colSpan={3}>PORTFOLIO TOTALS</td>
                <td className="p-3 font-mono text-slate-900">{formatCurrency(sumLent)}</td>
                <td className="p-3" colSpan={3}></td>
                <td className="p-3 font-mono text-blue-700">{formatCurrency(sumPrincPaid)}</td>
                <td className="p-3 font-mono text-emerald-700">{formatCurrency(sumIntPaid)}</td>
                <td className="p-3 font-mono text-rose-700">{formatCurrency(sumDue)}</td>
              </tr>
            );
          },
        };

      case 'borrower-report':
        return {
          headers: ['ID', 'Full Name', 'Phone', 'Address', 'Total Loans', 'Active Loans', 'Total Borrowed (₹)', 'Total Repaid (₹)', 'Principal Due (₹)', 'Total Pending (₹)'],
          renderRow: (item: Record<string, unknown>, idx: number) => (
            <tr key={idx} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 text-xs">
              <td className="p-3 font-mono font-semibold text-indigo-600">{String(item.borrowerId)}</td>
              <td className="p-3 font-semibold text-slate-900">{String(item.fullName)}</td>
              <td className="p-3 font-mono text-slate-600">{String(item.phone)}</td>
              <td className="p-3 text-slate-500 max-w-[200px] truncate">{String(item.address || '-')}</td>
              <td className="p-3 text-center">{String(item.totalLoans)}</td>
              <td className="p-3 text-center font-bold text-indigo-600">{String(item.activeLoans)}</td>
              <td className="p-3 font-mono font-semibold text-slate-900">{formatCurrency(item.totalBorrowed as number)}</td>
              <td className="p-3 font-mono font-medium text-emerald-700">{formatCurrency(item.totalRepaid as number)}</td>
              <td className="p-3 font-mono font-medium text-blue-700">{formatCurrency(item.principalOutstanding as number)}</td>
              <td className="p-3 font-mono font-black text-rose-700">{formatCurrency(item.totalOutstanding as number)}</td>
            </tr>
          ),
          renderTotal: () => {
            const totalBorrowed = data.reduce((s, d) => s + Number(d.totalBorrowed || 0), 0);
            const totalRepaid = data.reduce((s, d) => s + Number(d.totalRepaid || 0), 0);
            const principalDue = data.reduce((s, d) => s + Number(d.principalOutstanding || 0), 0);
            const totalDue = data.reduce((s, d) => s + Number(d.totalOutstanding || 0), 0);
            return (
              <tr className="bg-slate-100/80 font-bold text-xs border-t-2 border-slate-300">
                <td className="p-3" colSpan={6}>TOTALS</td>
                <td className="p-3 font-mono text-slate-900">{formatCurrency(totalBorrowed)}</td>
                <td className="p-3 font-mono text-emerald-700">{formatCurrency(totalRepaid)}</td>
                <td className="p-3 font-mono text-blue-700">{formatCurrency(principalDue)}</td>
                <td className="p-3 font-mono text-rose-700">{formatCurrency(totalDue)}</td>
              </tr>
            );
          },
        };

      case 'payment-report':
        return {
          headers: ['Receipt ID', 'Date', 'Loan ID', 'Borrower', 'Amount (₹)', 'Principal (₹)', 'Interest (₹)', 'Mode', 'Ref / UTR', 'Status'],
          renderRow: (item: Record<string, unknown>, idx: number) => (
            <tr key={idx} className={`hover:bg-slate-50/80 transition-colors border-b border-slate-100 text-xs ${item.isVoid ? 'opacity-50 line-through bg-rose-50/30' : ''}`}>
              <td className="p-3 font-mono font-semibold text-indigo-600">{String(item.paymentId)}</td>
              <td className="p-3">{formatDate(item.paymentDate as string)}</td>
              <td className="p-3 font-mono">{String(item.loanId)}</td>
              <td className="p-3 font-semibold text-slate-900">{String(item.borrowerName)}</td>
              <td className="p-3 font-mono font-bold text-emerald-700">{formatCurrency(item.paymentAmount as number)}</td>
              <td className="p-3 font-mono text-blue-700">{formatCurrency(item.principalPortion as number)}</td>
              <td className="p-3 font-mono text-indigo-700">{formatCurrency(item.interestPortion as number)}</td>
              <td className="p-3 capitalize">{String(item.paymentMode).replace('_', ' ')}</td>
              <td className="p-3 font-mono text-[11px] text-slate-500">{String(item.referenceNumber || '-')}</td>
              <td className="p-3">{getStatusBadge(item.isVoid ? 'void' : 'false')}</td>
            </tr>
          ),
          renderTotal: () => {
            const valid = data.filter(d => !d.isVoid);
            const total = valid.reduce((s, d) => s + Number(d.paymentAmount || 0), 0);
            const princ = valid.reduce((s, d) => s + Number(d.principalPortion || 0), 0);
            const int = valid.reduce((s, d) => s + Number(d.interestPortion || 0), 0);
            return (
              <tr className="bg-slate-100/80 font-bold text-xs border-t-2 border-slate-300">
                <td className="p-3" colSpan={4}>COLLECTION TOTALS (VALID)</td>
                <td className="p-3 font-mono text-emerald-700">{formatCurrency(total)}</td>
                <td className="p-3 font-mono text-blue-700">{formatCurrency(princ)}</td>
                <td className="p-3 font-mono text-indigo-700">{formatCurrency(int)}</td>
                <td className="p-3" colSpan={3}></td>
              </tr>
            );
          },
        };

      case 'outstanding-report':
        return {
          headers: ['Loan ID', 'Borrower', 'Phone', 'Disbursal Date', 'Days Active', 'Principal Lent (₹)', 'Principal Due (₹)', 'Interest Due (₹)', 'Total Pending (₹)'],
          renderRow: (item: Record<string, unknown>, idx: number) => (
            <tr key={idx} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 text-xs">
              <td className="p-3 font-mono font-semibold text-indigo-600">{String(item.loanId)}</td>
              <td className="p-3 font-semibold text-slate-900">{String(item.borrowerName)}</td>
              <td className="p-3 font-mono text-slate-500">{String(item.borrowerPhone || '-')}</td>
              <td className="p-3 text-slate-600">{formatDate(item.loanGivenDate as string)}</td>
              <td className="p-3 text-slate-700 font-bold text-center">{String(item.daysActive)} d</td>
              <td className="p-3 font-mono font-semibold text-slate-900">{formatCurrency(item.principalAmount as number)}</td>
              <td className="p-3 font-mono text-blue-700 font-semibold">{formatCurrency(item.principalOutstanding as number)}</td>
              <td className="p-3 font-mono text-amber-700 font-semibold">{formatCurrency(item.interestOutstanding as number)}</td>
              <td className="p-3 font-mono font-black text-rose-700">{formatCurrency(item.totalOutstanding as number)}</td>
            </tr>
          ),
          renderTotal: () => {
            const sumLent = data.reduce((s, d) => s + Number(d.principalAmount || 0), 0);
            const sumPrincDue = data.reduce((s, d) => s + Number(d.principalOutstanding || 0), 0);
            const sumIntDue = data.reduce((s, d) => s + Number(d.interestOutstanding || 0), 0);
            const sumTotalDue = data.reduce((s, d) => s + Number(d.totalOutstanding || 0), 0);
            return (
              <tr className="bg-slate-100/80 font-bold text-xs border-t-2 border-slate-300">
                <td className="p-3" colSpan={5}>TOTAL OUTSTANDING</td>
                <td className="p-3 font-mono text-slate-900">{formatCurrency(sumLent)}</td>
                <td className="p-3 font-mono text-blue-700">{formatCurrency(sumPrincDue)}</td>
                <td className="p-3 font-mono text-amber-700">{formatCurrency(sumIntDue)}</td>
                <td className="p-3 font-mono text-rose-700">{formatCurrency(sumTotalDue)}</td>
              </tr>
            );
          },
        };

      case 'overdue-report':
        return {
          headers: ['Loan ID', 'Borrower', 'Phone', 'Due Date', 'Days Overdue', 'Principal Lent (₹)', 'Total Overdue Balance (₹)'],
          renderRow: (item: Record<string, unknown>, idx: number) => (
            <tr key={idx} className="hover:bg-rose-50/40 transition-colors border-b border-rose-100 text-xs">
              <td className="p-3 font-mono font-semibold text-rose-600">{String(item.loanId)}</td>
              <td className="p-3 font-semibold text-slate-900">{String(item.borrowerName)}</td>
              <td className="p-3 font-mono text-slate-500">{String(item.borrowerPhone || '-')}</td>
              <td className="p-3 font-mono text-rose-700 font-bold">{formatDate(item.dueDate as string)}</td>
              <td className="p-3 text-center">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                  {String(item.daysOverdue)} Days
                </span>
              </td>
              <td className="p-3 font-mono font-semibold text-slate-900">{formatCurrency(item.principalAmount as number)}</td>
              <td className="p-3 font-mono font-black text-rose-700">{formatCurrency(item.totalOutstanding as number)}</td>
            </tr>
          ),
          renderTotal: () => {
            const sumDue = data.reduce((s, d) => s + Number(d.totalOutstanding || 0), 0);
            return (
              <tr className="bg-rose-100/80 font-bold text-xs border-t-2 border-rose-300">
                <td className="p-3" colSpan={6}>TOTAL OVERDUE RECOVERY REQUIRED</td>
                <td className="p-3 font-mono text-rose-900">{formatCurrency(sumDue)}</td>
              </tr>
            );
          },
        };

      case 'interest-report':
        return {
          headers: ['Period', 'Expected Total Interest (₹)', 'Realized Interest Profit (₹)', 'Pending Interest (₹)', 'Profit Realization (%)'],
          renderRow: (item: Record<string, unknown>, idx: number) => {
            const exp = Number(item.expectedInterest || 0);
            const real = Number(item.realizedInterest || 0);
            const rate = exp > 0 ? ((real / exp) * 100).toFixed(1) : '0.0';
            return (
              <tr key={idx} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 text-xs">
                <td className="p-3 font-mono font-bold text-slate-900">{String(item.period)}</td>
                <td className="p-3 font-mono font-semibold text-indigo-700">{formatCurrency(exp)}</td>
                <td className="p-3 font-mono font-bold text-emerald-700">{formatCurrency(real)}</td>
                <td className="p-3 font-mono font-semibold text-amber-700">{formatCurrency(item.pendingInterest as number)}</td>
                <td className="p-3 font-mono font-bold text-slate-800">{rate}%</td>
              </tr>
            );
          },
          renderTotal: () => {
            const exp = data.reduce((s, d) => s + Number(d.expectedInterest || 0), 0);
            const real = data.reduce((s, d) => s + Number(d.realizedInterest || 0), 0);
            const pend = data.reduce((s, d) => s + Number(d.pendingInterest || 0), 0);
            const rate = exp > 0 ? ((real / exp) * 100).toFixed(1) : '0.0';
            return (
              <tr className="bg-slate-100/80 font-bold text-xs border-t-2 border-slate-300">
                <td className="p-3">TOTALS</td>
                <td className="p-3 font-mono text-indigo-700">{formatCurrency(exp)}</td>
                <td className="p-3 font-mono text-emerald-700">{formatCurrency(real)}</td>
                <td className="p-3 font-mono text-amber-700">{formatCurrency(pend)}</td>
                <td className="p-3 font-mono text-slate-900">{rate}%</td>
              </tr>
            );
          },
        };

      case 'monthly-collection':
        return {
          headers: ['Month', 'Year', 'Repayment Count', 'Principal Recovered (₹)', 'Interest Profit Earned (₹)', 'Total Collected (₹)'],
          renderRow: (item: Record<string, unknown>, idx: number) => (
            <tr key={idx} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 text-xs">
              <td className="p-3 font-bold text-slate-900">{String(item.month)}</td>
              <td className="p-3 font-mono text-slate-600">{String(item.year)}</td>
              <td className="p-3 text-center font-bold text-indigo-600">{String(item.paymentCount)}</td>
              <td className="p-3 font-mono font-semibold text-blue-700">{formatCurrency(item.principalCollected as number)}</td>
              <td className="p-3 font-mono font-bold text-indigo-700">{formatCurrency(item.interestCollected as number)}</td>
              <td className="p-3 font-mono font-black text-emerald-700">{formatCurrency(item.totalCollected as number)}</td>
            </tr>
          ),
          renderTotal: () => {
            const count = data.reduce((s, d) => s + Number(d.paymentCount || 0), 0);
            const princ = data.reduce((s, d) => s + Number(d.principalCollected || 0), 0);
            const int = data.reduce((s, d) => s + Number(d.interestCollected || 0), 0);
            const total = data.reduce((s, d) => s + Number(d.totalCollected || 0), 0);
            return (
              <tr className="bg-slate-100/80 font-bold text-xs border-t-2 border-slate-300">
                <td className="p-3" colSpan={2}>ANNUAL TOTALS</td>
                <td className="p-3 text-center font-mono text-slate-900">{count}</td>
                <td className="p-3 font-mono text-blue-700">{formatCurrency(princ)}</td>
                <td className="p-3 font-mono text-indigo-700">{formatCurrency(int)}</td>
                <td className="p-3 font-mono text-emerald-700">{formatCurrency(total)}</td>
              </tr>
            );
          },
        };
    }
  };

  const config = renderTableContent();

  return (
    <Card className="border border-slate-200 shadow-sm overflow-hidden">
      {/* Printable Report Header */}
      <div className="hidden print:block p-6 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 uppercase">{APP_NAME}</h1>
        <h2 className="text-sm font-semibold text-slate-600 capitalize">{reportType.replace('-', ' ')}</h2>
        <p className="text-xs text-slate-400 mt-1">Generated on: {new Date().toLocaleString()} | Total Records: {data.length}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {config.headers.map((h, i) => (
                <th key={i} className="p-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100 animate-pulse">
                  {config.headers.map((__, j) => (
                    <td key={j} className="p-3">
                      <div className="h-4 bg-slate-200 rounded w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={config.headers.length} className="py-12 text-center text-slate-400 text-xs">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileQuestion className="w-8 h-8 text-slate-300" />
                    <p>No records found matching the active filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => config.renderRow(item, idx))
            )}
          </tbody>
          {data.length > 0 && <tfoot>{config.renderTotal()}</tfoot>}
        </table>
      </div>

      {/* Pagination Controls */}
      {!isLoading && data.length > pageSize && (
        <div className="flex items-center justify-between p-3 border-t border-slate-100 bg-white no-print">
          <p className="text-xs text-slate-500">
            Showing <span className="font-bold">{(page - 1) * pageSize + 1}</span> to{' '}
            <span className="font-bold">{Math.min(page * pageSize, data.length)}</span> of{' '}
            <span className="font-bold">{data.length}</span> entries
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ReportTable;
