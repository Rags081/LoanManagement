import { createContext } from 'react';
import { SystemSettings } from '../types/settings';

export interface SettingsContextType {
  settings: SystemSettings;
  isLoading: boolean;
  currencySymbol: string;
  currencyCode: string;
  dateFormat: string;
  appName: string;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<boolean>;
  resetSettings: () => Promise<boolean>;
  reloadSettings: () => Promise<void>;
}

export const DEFAULT_SETTINGS_STATE: SystemSettings = {
  app_name: 'SmartLend Portfolio Manager',
  company_name: 'SmartLend Financial Services',
  company_phone: '+91 9876543210',
  company_email: 'support@smartlend.local',
  company_address: 'Suite 400, Financial District, Mumbai',
  tax_number: 'GSTIN27AAAAA0000A1Z5',
  currency_symbol: '₹',
  currency_format: 'INR',
  date_format: 'DD-MMM-YYYY',
  timezone: 'Asia/Kolkata',
  default_interest_rate: 3.0,
  interest_calculation_type: 'monthly',
  payment_allocation_method: 'principal_first',
  enable_overdue_interest: false,
  grace_period_days: 0,
  default_tenure: 12,
  default_tenure_unit: 'months',
  borrower_id_prefix: 'BOR',
  loan_id_prefix: 'LN',
  payment_id_prefix: 'PAY',
  capital_id_prefix: 'CAP',
  overdue_alert_days: 7,
  send_email_alerts: false,
  auto_logout_minutes: 60,
  enable_audit_logging: true,
};

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);
