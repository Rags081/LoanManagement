-- Migration 006: Create capital_transactions table
CREATE TABLE IF NOT EXISTS capital_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transaction_id VARCHAR(20) NOT NULL UNIQUE,  -- Format: CAP-001
  transaction_date DATE NOT NULL,
  transaction_type ENUM('capital_given', 'capital_returned', 'adjustment') NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  source VARCHAR(100) NULL DEFAULT NULL,
  destination VARCHAR(100) NULL DEFAULT NULL,
  description VARCHAR(255) NULL DEFAULT NULL,
  reference_number VARCHAR(100) NULL DEFAULT NULL,
  notes TEXT NULL DEFAULT NULL,
  running_balance DECIMAL(15,2) NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_transaction_id (transaction_id),
  INDEX idx_transaction_date (transaction_date),
  INDEX idx_transaction_type (transaction_type),
  INDEX idx_created_by (created_by),
  INDEX idx_deleted_at (deleted_at),
  CONSTRAINT chk_capital_amount_positive CHECK (amount > 0),
  CONSTRAINT fk_capital_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
