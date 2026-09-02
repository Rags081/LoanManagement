-- Migration 011: Make tenure and due_date nullable for open-ended loans
ALTER TABLE loans
MODIFY COLUMN tenure INT NULL DEFAULT NULL,
MODIFY COLUMN tenure_unit ENUM('days', 'months', 'years') NULL DEFAULT 'months',
MODIFY COLUMN due_date DATE NULL DEFAULT NULL;
