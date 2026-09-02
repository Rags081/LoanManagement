# 🗄️ Database Architecture & Schema Reference

Database Management System: **MySQL 8.0+**  
Default Database Name: `loan_management`  
Character Set / Collation: `utf8mb4 / utf8mb4_unicode_ci`

---

## 📊 Entity Relationship Summary

```
users (1) ────< (N) borrowers
users (1) ────< (N) loans
users (1) ────< (N) payments
users (1) ────< (N) capital_transactions
users (1) ────< (N) audit_logs

borrowers (1) ────< (N) loans (1) ────< (N) payments (1) ────< (N) payment_allocations
```

---

## 📋 Tables & Schema Reference

### 1. `users`
Stores system operators, managers, and administrators.
- `id`: INT, PRIMARY KEY, AUTO_INCREMENT
- `email`: VARCHAR(255), UNIQUE, NOT NULL
- `password_hash`: VARCHAR(255), NOT NULL
- `full_name`: VARCHAR(100), NOT NULL
- `role`: ENUM('admin', 'operator', 'viewer'), DEFAULT 'operator'
- `is_active`: BOOLEAN, DEFAULT TRUE
- `last_login_at`: TIMESTAMP, NULL
- `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
- `updated_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- `deleted_at`: TIMESTAMP, NULL

### 2. `borrowers`
Stores client profile, contact, and credit records.
- `id`: INT, PRIMARY KEY, AUTO_INCREMENT
- `borrower_id`: VARCHAR(20), UNIQUE, NOT NULL (Format: `BOR-001`)
- `full_name`: VARCHAR(100), NOT NULL
- `phone`: VARCHAR(20), NOT NULL
- `email`: VARCHAR(255), NULL
- `address`: TEXT, NULL
- `notes`: TEXT, NULL
- `status`: ENUM('active', 'inactive', 'blacklisted'), DEFAULT 'active'
- `created_by`: INT, FK → `users.id`
- Timestamps & `deleted_at`

### 3. `loans`
Stores loan contracts, interest models, and tenure terms.
- `id`: INT, PRIMARY KEY, AUTO_INCREMENT
- `loan_id`: VARCHAR(20), UNIQUE, NOT NULL (Format: `LN-001`)
- `borrower_id`: INT, FK → `borrowers.id`
- `principal_amount`: DECIMAL(15,2), CHECK > 0
- `interest_rate`: DECIMAL(10,4), CHECK >= 0
- `interest_rate_type`: ENUM('monthly', 'daily', 'flat'), DEFAULT 'monthly'
- `tenure`: INT, CHECK > 0
- `tenure_unit`: ENUM('days', 'months', 'years'), DEFAULT 'months'
- `loan_given_date`: DATE, NOT NULL
- `due_date`: DATE, NOT NULL
- `total_expected_interest`: DECIMAL(15,2), DEFAULT 0
- `total_expected_repayment`: DECIMAL(15,2), DEFAULT 0
- `status`: ENUM('active', 'overdue', 'completed', 'cancelled'), DEFAULT 'active'
- `created_by`: INT, FK → `users.id`
- Timestamps & `deleted_at`

### 4. `payments`
Stores repayment events and void tracking.
- `id`: INT, PRIMARY KEY, AUTO_INCREMENT
- `payment_id`: VARCHAR(20), UNIQUE, NOT NULL (Format: `PAY-001`)
- `loan_id`: INT, FK → `loans.id`
- `payment_date`: DATE, NOT NULL
- `payment_amount`: DECIMAL(15,2), CHECK > 0
- `principal_portion`: DECIMAL(15,2), DEFAULT 0
- `interest_portion`: DECIMAL(15,2), DEFAULT 0
- `payment_mode`: ENUM('cash', 'upi', 'bank_transfer', 'other')
- `reference_number`: VARCHAR(100), NULL
- `is_void`: BOOLEAN, DEFAULT FALSE
- `void_reason`: TEXT, NULL
- `voided_at`: TIMESTAMP, NULL
- `voided_by`: INT, FK → `users.id`
- `created_by`: INT, FK → `users.id`

### 5. `payment_allocations`
Stores line-item allocations towards principal, interest, fees.
- `id`: INT, PRIMARY KEY, AUTO_INCREMENT
- `payment_id`: INT, FK → `payments.id` ON DELETE CASCADE
- `allocated_to`: ENUM('principal', 'interest', 'late_fee', 'penalty')
- `amount`: DECIMAL(15,2), CHECK > 0
- `running_principal_balance`: DECIMAL(15,2)
- `running_interest_balance`: DECIMAL(15,2)
- `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP

### 6. `capital_transactions`
Stores equity deposits, owner withdrawals, and running pool balances.
- `id`: INT, PRIMARY KEY, AUTO_INCREMENT
- `transaction_id`: VARCHAR(20), UNIQUE, NOT NULL (Format: `CAP-001`)
- `transaction_date`: DATE, NOT NULL
- `transaction_type`: ENUM('capital_given', 'capital_returned', 'adjustment')
- `amount`: DECIMAL(15,2), CHECK > 0
- `source` / `destination` / `description` / `reference_number`: VARCHAR
- `running_balance`: DECIMAL(15,2)
- `created_by`: INT, FK → `users.id`
- Timestamps & `deleted_at`

### 7. `audit_logs` & `settings`
- `audit_logs`: JSON change diffs (`old_data`, `new_data`), IP address, user agent, actor FK.
- `settings`: Key-value configuration store (`setting_key`, `setting_value`, `setting_type`).
