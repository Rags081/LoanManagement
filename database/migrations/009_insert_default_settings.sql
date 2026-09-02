-- Migration 009: Insert default settings
INSERT INTO settings (setting_key, setting_value, setting_type, description)
VALUES
  ('payment_allocation_method', 'principal_first', 'string', 'How payments are allocated: principal_first, interest_first, proportional'),
  ('interest_calculation_type', 'simple', 'string', 'Default interest calculation method'),
  ('currency_symbol', '₹', 'string', 'Currency symbol'),
  ('currency_format', 'INR', 'string', 'Currency code'),
  ('date_format', 'DD-MMM-YYYY', 'string', 'Date display format'),
  ('enable_overdue_interest', 'false', 'boolean', 'Whether to charge interest on overdue amount'),
  ('grace_period_days', '0', 'number', 'Days before overdue is triggered'),
  ('loan_id_prefix', 'LN', 'string', 'Prefix for loan IDs'),
  ('payment_id_prefix', 'PAY', 'string', 'Prefix for payment IDs'),
  ('capital_id_prefix', 'CAP', 'string', 'Prefix for capital transaction IDs'),
  ('borrower_id_prefix', 'BOR', 'string', 'Prefix for borrower IDs')
ON DUPLICATE KEY UPDATE
  setting_value = VALUES(setting_value),
  setting_type = VALUES(setting_type),
  description = VALUES(description);
