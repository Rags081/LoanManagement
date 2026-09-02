import React, { useState } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { Borrower } from '@/types/borrower';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import {
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  ShieldAlert,
} from 'lucide-react';

interface BorrowerListProps {
  borrowers: Borrower[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isLoading: boolean;
  onPageChange: (newPage: number) => void;
  onView: (borrower: Borrower) => void;
  onEdit: (borrower: Borrower) => void;
  onDelete: (borrower: Borrower) => void;
}

export const BorrowerList: React.FC<BorrowerListProps> = ({
  borrowers,
  total,
  page,
  totalPages,
  isLoading,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canEdit = user?.role === 'admin' || user?.role === 'operator';

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const getStatusBadge = (status: Borrower['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Active
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <XCircle className="w-3 h-3" /> Inactive
          </span>
        );
      case 'blacklisted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert className="w-3 h-3" /> Blacklisted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
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
    <Card className="overflow-hidden border border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <th className="py-3 px-4">Borrower ID</th>
              <th className="py-3 px-4">Full Name</th>
              <th className="py-3 px-4">Contact Info</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Registered</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                  Loading borrowers list...
                </td>
              </tr>
            ) : borrowers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                  No borrowers found matching your search and filter criteria.
                </td>
              </tr>
            ) : (
              borrowers.map((borrower) => (
                <tr key={borrower.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* ID */}
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                    {borrower.borrowerId}
                  </td>

                  {/* Name */}
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => onView(borrower)}
                      className="font-bold text-slate-900 hover:text-primary-600 text-left transition-colors cursor-pointer"
                    >
                      {borrower.fullName}
                    </button>
                    {borrower.address && (
                      <p className="text-[11px] text-slate-400 truncate max-w-xs">
                        {borrower.address}
                      </p>
                    )}
                  </td>

                  {/* Contact */}
                  <td className="py-3.5 px-4 text-xs space-y-0.5">
                    <div className="flex items-center gap-1.5 font-mono text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      +91 {borrower.phone}
                    </div>
                    {borrower.email && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {borrower.email}
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">{getStatusBadge(borrower.status)}</td>

                  {/* Created At */}
                  <td className="py-3.5 px-4 text-slate-500 text-xs whitespace-nowrap">
                    {parseSafeDate(borrower.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(borrower)}
                        title="View Profile & Loans"
                        className="p-1.5 text-slate-600 hover:text-primary-600 hover:bg-primary-50"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(borrower)}
                          title="Edit Profile"
                          className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}

                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete borrower "${borrower.fullName}" (${borrower.borrowerId})?`)) {
                              setDeletingId(borrower.id);
                              onDelete(borrower);
                            }
                          }}
                          disabled={deletingId === borrower.id}
                          title="Delete Borrower"
                          className="p-1.5 text-slate-400 hover:text-danger-600 hover:bg-danger-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50">
          <div>
            Showing <span className="font-semibold text-slate-700">{borrowers.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{total}</span> borrowers
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-medium text-slate-700">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default BorrowerList;
