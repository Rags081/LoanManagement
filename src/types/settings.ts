export interface SystemSettings {
  // General & Business Profile
  app_name: string;
  company_name: string;
  company_phone: string;
  company_email: string;
  company_address: string;
  tax_number: string;
  currency_symbol: string;
  currency_format: string;
  date_format: string;
  timezone: string;

  // Loan & Repayment Engine Defaults
  default_interest_rate: number;
  interest_calculation_type: 'monthly' | 'daily_prorated' | 'flat';
  payment_allocation_method: 'principal_first' | 'interest_first' | 'proportional';
  enable_overdue_interest: boolean;
  grace_period_days: number;
  default_tenure: number;
  default_tenure_unit: 'days' | 'weeks' | 'months' | 'years';

  // Numbering & ID Formats
  borrower_id_prefix: string;
  loan_id_prefix: string;
  payment_id_prefix: string;
  capital_id_prefix: string;

  // Alerts & Security Preferences
  overdue_alert_days: number;
  send_email_alerts: boolean;
  auto_logout_minutes: number;
  enable_audit_logging: boolean;

  [key: string]: unknown;
}

export interface SystemInfoData {
  status: 'healthy' | 'degraded' | 'error';
  pingMs: number;
  database: string;
  serverTime: string;
  uptimeSeconds: number;
  nodeVersion: string;
  tableCounts: {
    borrowers: number;
    loans: number;
    payments: number;
    capitalTransactions: number;
    auditLogs: number;
    users: number;
    settings: number;
  };
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface SettingsSaveResponse {
  success: boolean;
  message: string;
  data: SystemSettings;
}
