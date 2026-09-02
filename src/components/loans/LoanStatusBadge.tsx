import React from 'react';
import { LoanStatus } from '@/types/loan';
import { CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react';

interface LoanStatusBadgeProps {
  status: LoanStatus;
  size?: 'sm' | 'md';
}

export const LoanStatusBadge: React.FC<LoanStatusBadgeProps> = ({
  status,
  size = 'sm',
}) => {
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  switch (status) {
    case 'active':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${padding}`}
        >
          <Clock className={iconSize} /> Active
        </span>
      );
    case 'overdue':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse ${padding}`}
        >
          <AlertTriangle className={iconSize} /> Overdue
        </span>
      );
    case 'completed':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200 ${padding}`}
        >
          <CheckCircle2 className={iconSize} /> Completed
        </span>
      );
    case 'cancelled':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-semibold bg-slate-100 text-slate-600 border border-slate-200 ${padding}`}
        >
          <XCircle className={iconSize} /> Cancelled
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 ${padding}`}>
          {status}
        </span>
      );
  }
};

export default LoanStatusBadge;
