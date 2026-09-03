import React, { useState, useEffect } from 'react';
import {
  Building2,
  Percent,
  Hash,
  Shield,
  Bell,
  Activity,
  Save,
  RotateCcw,
  Download,
  CheckCircle2,
  AlertTriangle,
  Key,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { settingsApi } from '@/api/settings';
import { SystemSettings, SystemInfoData } from '@/types/settings';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Form/Input';
import Select from '@/components/common/Form/Select';
import toast from 'react-hot-toast';

type TabKey = 'general' | 'loan_engine' | 'numbering' | 'security' | 'alerts' | 'maintenance';

export const Settings: React.FC = () => {
  const { settings, isLoading, updateSettings, resetSettings } = useSettings();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [formData, setFormData] = useState<SystemSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // System Diagnostics State
  const [systemInfo, setSystemInfo] = useState<SystemInfoData | null>(null);
  const [isLoadingSystemInfo, setIsLoadingSystemInfo] = useState(false);
  const [isDownloadingBackup, setIsDownloadingBackup] = useState(false);

  // Sync form data when settings load
  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  // Load system info when maintenance tab is active
  useEffect(() => {
    if (activeTab === 'maintenance') {
      fetchSystemInfo();
    }
  }, [activeTab]);

  const fetchSystemInfo = async () => {
    try {
      setIsLoadingSystemInfo(true);
      const info = await settingsApi.getSystemInfo();
      setSystemInfo(info);
    } catch {
      toast.error('Failed to retrieve system diagnostics');
    } finally {
      setIsLoadingSystemInfo(false);
    }
  };

  const handleFieldChange = (key: keyof SystemSettings, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const success = await updateSettings(formData);
      if (success) {
        setFormData((prev) => ({ ...prev, ...formData }));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetConfirm = async () => {
    setIsResetting(true);
    try {
      const success = await resetSettings();
      if (success) {
        setShowResetModal(false);
      }
    } finally {
      setIsResetting(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await settingsApi.changePassword({ currentPassword, newPassword });
      toast.success(res.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to change password';
      toast.error(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDownloadBackup = async () => {
    setIsDownloadingBackup(true);
    try {
      await settingsApi.downloadBackup();
      toast.success('Database backup downloaded successfully!');
    } catch {
      toast.error('Failed to download system backup');
    } finally {
      setIsDownloadingBackup(false);
    }
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; desc: string }[] = [
    { key: 'general', label: 'General & Profile', icon: <Building2 className="w-4 h-4" />, desc: 'Company details, currency & localization' },
    { key: 'loan_engine', label: 'Loan Engine Defaults', icon: <Percent className="w-4 h-4" />, desc: 'Interest rates, accruals & allocation rules' },
    { key: 'numbering', label: 'ID Numbering Prefixes', icon: <Hash className="w-4 h-4" />, desc: 'Auto-ID prefixes and formatting' },
    { key: 'security', label: 'Security & Password', icon: <Shield className="w-4 h-4" />, desc: 'Admin credentials & session security' },
    { key: 'alerts', label: 'Alerts & Reminders', icon: <Bell className="w-4 h-4" />, desc: 'Overdue thresholds & notifications' },
    { key: 'maintenance', label: 'System Health & Backup', icon: <Activity className="w-4 h-4" />, desc: 'Live diagnostics, backup & factory reset' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings & Preferences</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              System Admin
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure application parameters, financial calculation rules, numbering formats, and system diagnostics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowResetModal(true)}
            className="flex items-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Reset Defaults</span>
          </Button>

          <Button
            type="button"
            onClick={() => handleSaveAll()}
            isLoading={isSaving || isLoading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Save All Changes</span>
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col items-center justify-center p-3 rounded-lg text-xs font-semibold transition-all text-center gap-1.5 ${
                isActive
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <div className={`p-1.5 rounded-md ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200/60 text-slate-500'}`}>
                {tab.icon}
              </div>
              <span className="truncate max-w-full">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: General & Business Profile */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveAll} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="🏢 Organization & Business Profile">
              <div className="space-y-4 pt-2">
                <Input
                  label="Application Display Name"
                  value={formData.app_name || ''}
                  onChange={(e) => handleFieldChange('app_name', e.target.value)}
                  placeholder="e.g. SmartLend Portfolio Manager"
                  helperText="Displayed across page titles, top navigation, and reports"
                />

                <Input
                  label="Company / Lender Name"
                  value={formData.company_name || ''}
                  onChange={(e) => handleFieldChange('company_name', e.target.value)}
                  placeholder="e.g. SmartLend Financial Services"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Contact Email"
                    type="email"
                    value={formData.company_email || ''}
                    onChange={(e) => handleFieldChange('company_email', e.target.value)}
                    placeholder="support@company.com"
                  />
                  <Input
                    label="Contact Phone"
                    value={formData.company_phone || ''}
                    onChange={(e) => handleFieldChange('company_phone', e.target.value)}
                    placeholder="+91 9876543210"
                  />
                </div>

                <Input
                  label="Office Address"
                  value={formData.company_address || ''}
                  onChange={(e) => handleFieldChange('company_address', e.target.value)}
                  placeholder="Business street address, City, State"
                />

                <Input
                  label="Business Tax / GST Number"
                  value={formData.tax_number || ''}
                  onChange={(e) => handleFieldChange('tax_number', e.target.value)}
                  placeholder="e.g. GSTIN27AAAAA0000A1Z5"
                />
              </div>
            </Card>

            <Card title="🌍 Currency, Date & Localization">
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Currency Symbol"
                    value={formData.currency_symbol || '₹'}
                    onChange={(e) => handleFieldChange('currency_symbol', e.target.value)}
                    placeholder="₹, $, €, £"
                    helperText="Symbol used in all money displays"
                  />

                  <Input
                    label="Currency Code"
                    value={formData.currency_format || 'INR'}
                    onChange={(e) => handleFieldChange('currency_format', e.target.value.toUpperCase())}
                    placeholder="INR, USD, EUR"
                  />
                </div>

                <Select
                  label="Date Display Format"
                  value={formData.date_format || 'DD-MMM-YYYY'}
                  onChange={(e) => handleFieldChange('date_format', e.target.value)}
                  options={[
                    { value: 'DD-MMM-YYYY', label: 'DD-MMM-YYYY (e.g. 15-Feb-2026)' },
                    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (e.g. 15/02/2026)' },
                    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (e.g. 2026-02-15)' },
                    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (e.g. 02/15/2026)' },
                  ]}
                />

                <Select
                  label="Primary Timezone"
                  value={formData.timezone || 'Asia/Kolkata'}
                  onChange={(e) => handleFieldChange('timezone', e.target.value)}
                  options={[
                    { value: 'Asia/Kolkata', label: 'India Standard Time (IST - UTC+5:30)' },
                    { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
                    { value: 'America/New_York', label: 'Eastern Time (ET - UTC-5)' },
                    { value: 'Europe/London', label: 'Greenwich Mean Time (GMT - UTC+0)' },
                    { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST - UTC+4)' },
                    { value: 'Asia/Singapore', label: 'Singapore Standard Time (SGT - UTC+8)' },
                  ]}
                />

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-600 space-y-1 mt-4">
                  <div className="font-semibold text-slate-800">Preview Settings:</div>
                  <div>Sample Amount: <span className="font-mono font-bold text-slate-900">{formData.currency_symbol || '₹'} 50,000.00 ({formData.currency_format || 'INR'})</span></div>
                  <div>Sample Date: <span className="font-mono font-bold text-slate-900">15-Feb-2026</span></div>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Save General Settings
            </Button>
          </div>
        </form>
      )}

      {/* Tab 2: Loan Engine Defaults */}
      {activeTab === 'loan_engine' && (
        <form onSubmit={handleSaveAll} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="📈 Interest & Calculation Methodology">
              <div className="space-y-4 pt-2">
                <Input
                  label="Default Monthly Interest Rate (%)"
                  type="number"
                  step="0.01"
                  value={formData.default_interest_rate ?? 3.0}
                  onChange={(e) => handleFieldChange('default_interest_rate', Number(e.target.value))}
                  helperText="Default interest rate pre-filled in new loan creation form"
                />

                <Select
                  label="Default Interest Calculation Method"
                  value={formData.interest_calculation_type || 'monthly'}
                  onChange={(e) => handleFieldChange('interest_calculation_type', e.target.value)}
                  options={[
                    { value: 'monthly', label: 'Monthly Standard (Full calendar month accrual)' },
                    { value: 'daily_prorated', label: 'Daily Pro-Rated (Accrues exact per-day rate)' },
                    { value: 'flat', label: 'Flat Fixed Rate (Fixed percentage over principal)' },
                  ]}
                  helperText="Configures the default amortization rule for new loan contracts"
                />

                <Select
                  label="Default Payment Allocation Strategy"
                  value={formData.payment_allocation_method || 'principal_first'}
                  onChange={(e) => handleFieldChange('payment_allocation_method', e.target.value)}
                  options={[
                    { value: 'principal_first', label: 'Principal First (Reduces principal balance before interest)' },
                    { value: 'interest_first', label: 'Interest First (Clears accumulated interest before principal)' },
                    { value: 'proportional', label: 'Proportional Split (Distributes payment ratio across both)' },
                  ]}
                  helperText="Controls how incoming repayments are allocated across loan balances"
                />
              </div>
            </Card>

            <Card title="⏳ Tenure, Grace Period & Overdue Rules">
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Default Loan Tenure"
                    type="number"
                    value={formData.default_tenure ?? 12}
                    onChange={(e) => handleFieldChange('default_tenure', Number(e.target.value))}
                  />
                  <Select
                    label="Tenure Unit"
                    value={formData.default_tenure_unit || 'months'}
                    onChange={(e) => handleFieldChange('default_tenure_unit', e.target.value)}
                    options={[
                      { value: 'days', label: 'Days' },
                      { value: 'weeks', label: 'Weeks' },
                      { value: 'months', label: 'Months' },
                      { value: 'years', label: 'Years' },
                    ]}
                  />
                </div>

                <Input
                  label="Grace Period (Days)"
                  type="number"
                  value={formData.grace_period_days ?? 0}
                  onChange={(e) => handleFieldChange('grace_period_days', Number(e.target.value))}
                  helperText="Number of grace days after due date before loan is marked overdue"
                />

                <div className="pt-2 border-t border-slate-100">
                  <label className="flex items-center justify-between cursor-pointer p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors">
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">Enable Overdue Penal Interest</div>
                      <div className="text-xs text-slate-500">Automatically compute penal surcharge on past-due contracts</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(formData.enable_overdue_interest)}
                      onChange={(e) => handleFieldChange('enable_overdue_interest', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Save Loan Engine Settings
            </Button>
          </div>
        </form>
      )}

      {/* Tab 3: ID Numbering Prefixes */}
      {activeTab === 'numbering' && (
        <form onSubmit={handleSaveAll} className="space-y-6">
          <Card title="🔢 Auto-Generated ID Numbering Prefixes">
            <p className="text-sm text-slate-500 mb-6">
              Customize prefixes used by the automatic ID sequence generator for new database records.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Borrower Prefix */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                  <span>Borrower Prefix</span>
                  <span className="px-2 py-0.5 font-mono text-xs bg-purple-100 text-purple-800 rounded font-semibold">
                    {formData.borrower_id_prefix || 'BOR'}-001
                  </span>
                </div>
                <Input
                  value={formData.borrower_id_prefix || 'BOR'}
                  onChange={(e) => handleFieldChange('borrower_id_prefix', e.target.value.toUpperCase().trim())}
                  placeholder="BOR"
                  helperText="Default: BOR"
                />
              </div>

              {/* Loan Prefix */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                  <span>Loan Prefix</span>
                  <span className="px-2 py-0.5 font-mono text-xs bg-indigo-100 text-indigo-800 rounded font-semibold">
                    {formData.loan_id_prefix || 'LN'}-001
                  </span>
                </div>
                <Input
                  value={formData.loan_id_prefix || 'LN'}
                  onChange={(e) => handleFieldChange('loan_id_prefix', e.target.value.toUpperCase().trim())}
                  placeholder="LN"
                  helperText="Default: LN"
                />
              </div>

              {/* Payment Prefix */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                  <span>Payment Receipt Prefix</span>
                  <span className="px-2 py-0.5 font-mono text-xs bg-emerald-100 text-emerald-800 rounded font-semibold">
                    {formData.payment_id_prefix || 'PAY'}-001
                  </span>
                </div>
                <Input
                  value={formData.payment_id_prefix || 'PAY'}
                  onChange={(e) => handleFieldChange('payment_id_prefix', e.target.value.toUpperCase().trim())}
                  placeholder="PAY"
                  helperText="Default: PAY"
                />
              </div>

              {/* Capital Prefix */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                  <span>Capital Txn Prefix</span>
                  <span className="px-2 py-0.5 font-mono text-xs bg-amber-100 text-amber-800 rounded font-semibold">
                    {formData.capital_id_prefix || 'CAP'}-001
                  </span>
                </div>
                <Input
                  value={formData.capital_id_prefix || 'CAP'}
                  onChange={(e) => handleFieldChange('capital_id_prefix', e.target.value.toUpperCase().trim())}
                  placeholder="CAP"
                  helperText="Default: CAP"
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" isLoading={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Save ID Prefixes
            </Button>
          </div>
        </form>
      )}

      {/* Tab 4: Security & Password Management */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Change Password Form */}
          <Card title="🔐 Change Admin Password">
            <form onSubmit={handleChangePasswordSubmit} className="space-y-4 pt-2">
              <p className="text-xs text-slate-500">
                Update your account password with strong bcrypt hashing. Requires verifying current password.
              </p>

              <div className="relative">
                <Input
                  label="Current Password"
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div className="relative">
                <Input
                  label="New Password"
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                />
              </div>

              <div className="relative">
                <Input
                  label="Confirm New Password"
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPasswords ? 'Hide Passwords' : 'Show Passwords'}</span>
                </button>

                <Button type="submit" isLoading={isChangingPassword} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Update Password
                </Button>
              </div>
            </form>
          </Card>

          {/* Session & Account Security */}
          <Card title="🛡️ Account & Session Preferences">
            <form onSubmit={handleSaveAll} className="space-y-4 pt-2">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Key className="w-4 h-4 text-indigo-600" />
                  <span>Authenticated Account</span>
                </div>
                <div>User: <span className="font-semibold text-slate-900">{user?.fullName || 'Administrator'}</span></div>
                <div>Email: <span className="font-mono text-slate-700">{user?.email || 'admin@loanmanagement.local'}</span></div>
                <div>Role: <span className="capitalize font-bold text-indigo-600">{user?.role || 'admin'}</span></div>
              </div>

              <Select
                label="Session Inactivity Timeout"
                value={String(formData.auto_logout_minutes ?? 60)}
                onChange={(e) => handleFieldChange('auto_logout_minutes', Number(e.target.value))}
                options={[
                  { value: '15', label: '15 Minutes' },
                  { value: '30', label: '30 Minutes' },
                  { value: '60', label: '60 Minutes (1 Hour)' },
                  { value: '120', label: '120 Minutes (2 Hours)' },
                  { value: '480', label: '480 Minutes (8 Hours)' },
                ]}
                helperText="Auto-expires auth token after period of inactivity"
              />

              <label className="flex items-center justify-between cursor-pointer p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors">
                <div>
                  <div className="font-semibold text-slate-900 text-sm">System Audit Logging</div>
                  <div className="text-xs text-slate-500">Log all creates, updates, and deletes to audit_logs table</div>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(formData.enable_audit_logging)}
                  onChange={(e) => handleFieldChange('enable_audit_logging', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              <div className="flex justify-end pt-2">
                <Button type="submit" isLoading={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Save Security Settings
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Tab 5: Alerts & Notifications */}
      {activeTab === 'alerts' && (
        <form onSubmit={handleSaveAll} className="space-y-6">
          <Card title="🔔 Delinquency Alerts & Reminder Thresholds">
            <div className="max-w-2xl space-y-6 pt-2">
              <Input
                label="Overdue Alert Badge Threshold (Days)"
                type="number"
                value={formData.overdue_alert_days ?? 7}
                onChange={(e) => handleFieldChange('overdue_alert_days', Number(e.target.value))}
                helperText="Number of days past due before triggering high-priority delinquency alerts in dashboard and reports"
              />

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">Automated Email Notifications</div>
                    <div className="text-xs text-slate-500">Send reminder emails when repayments are approaching or past due</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(formData.send_email_alerts)}
                    onChange={(e) => handleFieldChange('send_email_alerts', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" isLoading={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Save Alert Preferences
            </Button>
          </div>
        </form>
      )}

      {/* Tab 6: System Diagnostics & Backup */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          {/* Health & Diagnostic Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card title="🖥️ Database Engine Status">
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <div className="font-bold text-emerald-950 text-sm">Connection Active</div>
                      <div className="text-xs text-emerald-700">MySQL Connection Pool Ready</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs bg-white px-2 py-1 rounded text-emerald-800 border border-emerald-200">
                    {systemInfo ? `${systemInfo.pingMs} ms` : 'Testing...'}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1.5 pt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Database Name:</span>
                    <span className="font-mono font-semibold text-slate-900">{systemInfo?.database || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Node Runtime:</span>
                    <span className="font-mono font-semibold text-slate-900">{systemInfo?.nodeVersion || 'v24.x'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Server Uptime:</span>
                    <span className="font-mono font-semibold text-slate-900">{systemInfo ? `${Math.floor(systemInfo.uptimeSeconds / 60)} mins` : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Server Time:</span>
                    <span className="font-mono font-semibold text-slate-900">{systemInfo?.serverTime ? new Date(systemInfo.serverTime).toLocaleTimeString() : '-'}</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={fetchSystemInfo}
                  isLoading={isLoadingSystemInfo}
                  className="w-full flex items-center justify-center gap-2 text-xs mt-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Connection Health</span>
                </Button>
              </div>
            </Card>

            {/* Table Row Statistics */}
            <div className="lg:col-span-2">
              <Card title="📊 Live Table Record Counts">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-center">
                    <div className="text-xs text-purple-600 font-semibold uppercase">Borrowers</div>
                    <div className="text-xl font-bold font-mono text-purple-950 mt-1">{systemInfo?.tableCounts.borrowers ?? '-'}</div>
                  </div>

                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-center">
                    <div className="text-xs text-indigo-600 font-semibold uppercase">Loans</div>
                    <div className="text-xl font-bold font-mono text-indigo-950 mt-1">{systemInfo?.tableCounts.loans ?? '-'}</div>
                  </div>

                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-center">
                    <div className="text-xs text-emerald-600 font-semibold uppercase">Payments</div>
                    <div className="text-xl font-bold font-mono text-emerald-950 mt-1">{systemInfo?.tableCounts.payments ?? '-'}</div>
                  </div>

                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-center">
                    <div className="text-xs text-amber-600 font-semibold uppercase">Capital Txns</div>
                    <div className="text-xl font-bold font-mono text-amber-950 mt-1">{systemInfo?.tableCounts.capitalTransactions ?? '-'}</div>
                  </div>

                  <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-center">
                    <div className="text-xs text-slate-600 font-semibold uppercase">Audit Logs</div>
                    <div className="text-xl font-bold font-mono text-slate-900 mt-1">{systemInfo?.tableCounts.auditLogs ?? '-'}</div>
                  </div>

                  <div className="p-3 bg-cyan-50/60 rounded-xl border border-cyan-100 text-center">
                    <div className="text-xs text-cyan-600 font-semibold uppercase">System Users</div>
                    <div className="text-xl font-bold font-mono text-cyan-950 mt-1">{systemInfo?.tableCounts.users ?? '-'}</div>
                  </div>

                  <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 text-center col-span-2">
                    <div className="text-xs text-rose-600 font-semibold uppercase">Configured Settings</div>
                    <div className="text-xl font-bold font-mono text-rose-950 mt-1">{systemInfo?.tableCounts.settings ?? '-'}</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Backup & Factory Reset Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="📥 System Database Backup">
              <div className="space-y-3 pt-2">
                <p className="text-xs text-slate-500">
                  Export a snapshot of all loan contracts, client records, repayments, capital ledgers, and configurations into a structured JSON backup.
                </p>
                <Button
                  type="button"
                  onClick={handleDownloadBackup}
                  isLoading={isDownloadingBackup}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Full JSON Database Backup</span>
                </Button>
              </div>
            </Card>

            <Card title="⚠️ Factory Reset">
              <div className="space-y-3 pt-2">
                <p className="text-xs text-slate-500">
                  Restores all financial calculation parameters, numbering prefixes, currency symbols, and alert settings to original factory defaults.
                </p>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => setShowResetModal(true)}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset All Settings to Factory Defaults</span>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Factory Reset Modal Confirmation */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Reset System Settings?</h3>
                <p className="text-xs text-slate-500">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-slate-600">
              Are you sure you want to reset all preferences, interest calculation rules, ID prefixes, and notification settings back to factory defaults? Your loan and borrower records will remain intact.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleResetConfirm}
                isLoading={isResetting}
              >
                Yes, Restore Defaults
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
