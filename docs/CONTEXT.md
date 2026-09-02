# 🧠 Technical Context & Architecture Principles

This document serves as the project context for AI assistants and software engineers working on the **Loan Management System**.

---

## 🎯 Core System Invariants & Rules

1. **Strict Financial Precision**:
   - Never use native JavaScript `+`, `-`, `*`, `/` on monetary values.
   - Always wrap financial numbers in `Decimal.js` (`new Decimal(val)`).
   - Database currency fields are strictly `DECIMAL(15,2)` and interest rates are `DECIMAL(10,4)`.

2. **Sequential Custom Identifiers**:
   - Entities must use atomic sequential identifiers (`BOR-001`, `LN-001`, `PAY-001`, `CAP-001`) generated via `generateId()`.

3. **Soft-Delete Invariant**:
   - Core domain models (`users`, `borrowers`, `loans`, `capital_transactions`) use soft deletes via `deleted_at`.
   - All repository `SELECT` queries must include `deleted_at IS NULL`.

4. **Audit Logging**:
   - Critical authentication and financial state transitions (logins, password changes, loan status updates, voids) must write immutable audit records to `audit_logs`.

5. **Role-Based Access Control**:
   - `admin`: Full unrestricted access across all modules, settings, and capital transactions.
   - `operator`: Can manage borrowers, loans, and record payments. Cannot modify capital pool or administrative settings.
   - `viewer`: Read-only access to portfolio reports and dashboard.
