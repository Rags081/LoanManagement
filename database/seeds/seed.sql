-- Database Seed: Default Admin User & Baseline Records
-- Password: Admin@123 (bcrypt hashed with salt rounds = 10)
-- Hash: $2a$10$y5Kz96z9Bgl8bK4tB2LgGeq4tDmsY8r9uNn4YpTf7U3I64rFpYmC2

INSERT INTO users (id, email, password_hash, full_name, role, is_active)
VALUES (
  1,
  'admin@loanmanagement.com',
  '$2a$10$y5Kz96z9Bgl8bK4tB2LgGeq4tDmsY8r9uNn4YpTf7U3I64rFpYmC2',
  'System Administrator',
  'admin',
  TRUE
)
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  role = VALUES(role),
  is_active = VALUES(is_active);
