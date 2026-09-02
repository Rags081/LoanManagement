-- Migration 004: Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payment_id VARCHAR(20) NOT NULL UNIQUE,  -- Format: PAY-001
  loan_id INT NOT NULL,
  payment_date DATE NOT NULL,
  payment_amount DECIMAL(15,2) NOT NULL,
  principal_portion DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  interest_portion DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  payment_mode ENUM('cash', 'upi', 'bank_transfer', 'other') NOT NULL,
  reference_number VARCHAR(100) NULL DEFAULT NULL,
  notes TEXT NULL DEFAULT NULL,
  is_void BOOLEAN NOT NULL DEFAULT FALSE,
  void_reason TEXT NULL DEFAULT NULL,
  voided_at TIMESTAMP NULL DEFAULT NULL,
  voided_by INT NULL DEFAULT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_payment_id (payment_id),
  INDEX idx_loan_id (loan_id),
  INDEX idx_payment_date (payment_date),
  INDEX idx_is_void (is_void),
  INDEX idx_created_by (created_by),
  CONSTRAINT chk_payment_amount_positive CHECK (payment_amount > 0),
  CONSTRAINT fk_payments_loan FOREIGN KEY (loan_id) REFERENCES loans(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_payments_voided_by FOREIGN KEY (voided_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_payments_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
