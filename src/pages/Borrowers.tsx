import React, { useState } from 'react';
import Button from '@/components/common/Button';
import {
  BorrowerFilters,
  BorrowerList,
  BorrowerForm,
  BorrowerProfileModal,
} from '@/components/borrowers';
import {
  useBorrowerList,
  useBorrower,
  useCreateBorrower,
  useUpdateBorrower,
  useDeleteBorrower,
} from '@/hooks/useBorrowers';
import { Borrower, BorrowerFilterParams } from '@/types/borrower';
import { BorrowerSchemaType } from '@/utils/validation';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Users } from 'lucide-react';

export const Borrowers: React.FC = () => {
  const { user } = useAuth();
  const canAdd = user?.role === 'admin' || user?.role === 'operator';
  const canEdit = user?.role === 'admin' || user?.role === 'operator';

  // Filters State
  const [filters, setFilters] = useState<BorrowerFilterParams>({
    page: 1,
    limit: 10,
    status: 'all',
    search: '',
  });

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingBorrower, setEditingBorrower] = useState<Borrower | null>(null);

  // Profile Modal State
  const [profileBorrowerId, setProfileBorrowerId] = useState<number | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // Queries
  const {
    data: listResponse,
    isLoading: isListLoading,
  } = useBorrowerList(filters);

  const {
    data: profileData,
    isLoading: isProfileLoading,
  } = useBorrower(profileBorrowerId || undefined);

  // Mutations
  const createMutation = useCreateBorrower();
  const updateMutation = useUpdateBorrower();
  const deleteMutation = useDeleteBorrower();

  // Handlers
  const handleOpenCreate = () => {
    setEditingBorrower(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (borrower: Borrower) => {
    setEditingBorrower(borrower);
    setIsFormOpen(true);
  };

  const handleViewProfile = (borrower: Borrower) => {
    setProfileBorrowerId(borrower.id);
    setIsProfileOpen(true);
  };

  const handleFormSubmit = async (data: BorrowerSchemaType) => {
    if (editingBorrower) {
      await updateMutation.mutateAsync({
        id: editingBorrower.id,
        data,
      });
    } else {
      await createMutation.mutateAsync(data);
    }
    setIsFormOpen(false);
    setEditingBorrower(null);
  };

  const handleDelete = async (borrower: Borrower) => {
    await deleteMutation.mutateAsync(borrower.id);
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      status: 'all',
      search: '',
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary-50 text-primary-600 border border-primary-100">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Borrowers Directory</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage borrower profiles, unique phone records, and credit statistics
            </p>
          </div>
        </div>

        {canAdd && (
          <Button
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-sm"
          >
            Register Borrower
          </Button>
        )}
      </div>

      {/* Filter Toolbar */}
      <BorrowerFilters
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
      />

      {/* Borrowers Table */}
      <BorrowerList
        borrowers={listResponse?.data || []}
        total={listResponse?.total || 0}
        page={listResponse?.page || 1}
        limit={listResponse?.limit || 10}
        totalPages={listResponse?.totalPages || 1}
        isLoading={isListLoading}
        onPageChange={(newPage) => setFilters((prev) => ({ ...prev, page: newPage }))}
        onView={handleViewProfile}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
      />

      {/* Create / Edit Modal Form */}
      <BorrowerForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingBorrower(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingBorrower}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Borrower Profile & Stats Modal */}
      <BorrowerProfileModal
        isOpen={isProfileOpen}
        onClose={() => {
          setIsProfileOpen(false);
          setProfileBorrowerId(null);
        }}
        borrower={profileData}
        isLoading={isProfileLoading}
        onEdit={() => {
          if (profileData) {
            setIsProfileOpen(false);
            handleOpenEdit(profileData);
          }
        }}
        canEdit={canEdit}
      />
    </div>
  );
};

export default Borrowers;
