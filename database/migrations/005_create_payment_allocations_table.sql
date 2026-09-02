-- Migration 005: Create payment_allocations table
CREATE TABLE IF NOT EXISTS payment_allocations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payment_id INT NOT NULL,
  allocated_to ENUM('principal', 'interest', 'late_fee', 'penalty') NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  running_principal_balance DECIMAL(15,2) NOT NULL,
  running_interest_balance DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_payment_id (payment_id),
  INDEX idx_allocated_to (allocated_to),
  CONSTRAINT chk_allocation_amount_positive CHECK (amount > 0),
  CONSTRAINT fk_allocations_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
