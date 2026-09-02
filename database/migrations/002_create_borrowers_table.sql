-- Migration 002: Create borrowers table
CREATE TABLE IF NOT EXISTS borrowers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  borrower_id VARCHAR(20) NOT NULL UNIQUE,  -- Format: BOR-001
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NULL DEFAULT NULL,
  address TEXT NULL DEFAULT NULL,
  notes TEXT NULL DEFAULT NULL,
  status ENUM('active', 'inactive', 'blacklisted') NOT NULL DEFAULT 'active',
  created_by INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_borrower_id (borrower_id),
  INDEX idx_phone (phone),
  INDEX idx_status (status),
  INDEX idx_created_by (created_by),
  INDEX idx_deleted_at (deleted_at),
  CONSTRAINT fk_borrowers_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
