import React from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import BorrowerStatsCards from './BorrowerStatsCards';
import BorrowerLoanHistory from './BorrowerLoanHistory';
import { BorrowerWithStats } from '@/types/borrower';
import { User, Phone, Mail, MapPin, FileText, Calendar, Edit2, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface BorrowerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  borrower: BorrowerWithStats | null | undefined;
  isLoading?: boolean;
  onEdit?: () => void;
  canEdit?: boolean;
}

export const BorrowerProfileModal: React.FC<BorrowerProfileModalProps> = ({
  isOpen,
  onClose,
  borrower,
  isLoading = false,
  onEdit,
  canEdit = true,
}) => {
  if (!borrower && !isLoading) return null;

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Active
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <XCircle className="w-3.5 h-3.5" /> Inactive
          </span>
        );
      case 'blacklisted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert className="w-3.5 h-3.5" /> Blacklisted
          </span>
        );
      default:
        return null;
    }
  };

  const parseSafeDate = (rawDate: string | undefined): string => {
    if (!rawDate) return '—';
    try {
      if (typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
        const [y, m, d] = rawDate.split('T')[0].split('-').map((n) => parseInt(n, 10));
        return format(new Date(y, m - 1, d, 12, 0, 0), 'dd MMM yyyy');
      }
      const d = new Date(rawDate);
      return !isNaN(d.getTime()) ? format(d, 'dd MMM yyyy') : rawDate;
    } catch {
      return String(rawDate).split('T')[0];
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={borrower ? `${borrower.fullName} (${borrower.borrowerId})` : 'Borrower Profile'}
      size="xl"
    >
      {isLoading || !borrower ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          Loading borrower profile and statistics...
        </div>
      ) : (
        <div className="space-y-5 pt-2">
          {/* Header Profile Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg shrink-0">
                <User className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900">{borrower.fullName}</h3>
                  <span className="font-mono text-xs font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                    {borrower.borrowerId}
                  </span>
                  {getStatusBadge(borrower.status)}
                </div>

                <div className="flex items-center gap-4 flex-wrap text-xs text-slate-600">
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    +91 {borrower.phone}
                  </span>
                  {borrower.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {borrower.email}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    Registered {parseSafeDate(borrower.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {canEdit && onEdit && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                onClick={onEdit}
                className="self-start sm:self-center"
              >
                Edit Profile
              </Button>
            )}
          </div>

          {/* Statistics Metric Cards */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
              Financial Overview
            </h4>
            <BorrowerStatsCards stats={borrower.stats} />
          </div>

          {/* Details (Address & Notes) */}
          {(borrower.address || borrower.notes) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {borrower.address && (
                <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Address
                  </div>
                  <p className="text-slate-600 pl-5">{borrower.address}</p>
                </div>
              )}
              {borrower.notes && (
                <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    Internal Notes
                  </div>
                  <p className="text-slate-600 pl-5">{borrower.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Loan History Section */}
          <BorrowerLoanHistory loans={borrower.loans || []} />

          {/* Footer */}
          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default BorrowerProfileModal;
