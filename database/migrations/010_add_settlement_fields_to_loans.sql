-- Migration 010: Add settlement_date to loans table
ALTER TABLE loans
ADD COLUMN settlement_date DATE NULL DEFAULT NULL AFTER status;
