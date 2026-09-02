import React from 'react';
import { Link } from 'react-router-dom';
import Card from '@/components/common/Card';
import { OverdueAlertItem } from '@/types/dashboard';
import { formatCurrency } from '@/utils/formatters';
import { AlertTriangle, ArrowRight, Phone, Clock } from 'lucide-react';

interface OverdueAlertListProps {
  alerts?: OverdueAlertItem[];
  isLoading?: boolean;
}

export const OverdueAlertList: React.FC<OverdueAlertListProps> = ({
  alerts = [],
  isLoading = false,
}) => {
  return (
    <Card className="p-5 border border-rose-200/80 bg-rose-50/20 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-rose-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-rose-950">Overdue Collection Alerts</h3>
            <p className="text-xs text-rose-700/80">Accounts past due date requiring attention</p>
          </div>
        </div>

        {alerts.length > 0 && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs">
            {alerts.length} Overdue
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-3 bg-white rounded-xl border border-slate-100 animate-pulse space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))
        ) : alerts.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 font-medium bg-white rounded-xl border border-emerald-100 p-4">
            🎉 Great job! No overdue loan accounts in the portfolio.
          </div>
        ) : (
          alerts.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-white rounded-xl border border-rose-100/80 hover:border-rose-300 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {item.loanId}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{item.borrowerName}</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {item.borrowerPhone && (
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-slate-400" /> {item.borrowerPhone}
                    </span>
                  )}
                  {item.daysOverdue > 0 && (
                    <span className="flex items-center gap-1 text-rose-600 font-semibold">
                      <Clock className="w-3 h-3" /> {item.daysOverdue} days overdue
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="text-left sm:text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Balance</p>
                  <p className="text-xs font-black text-rose-700">{formatCurrency(item.totalOutstanding)}</p>
                </div>

                <Link
                  to={`/loans/${item.id}`}
                  className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                  title="View Loan Details"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default OverdueAlertList;
