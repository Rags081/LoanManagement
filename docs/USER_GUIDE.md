# 📖 User Guide - Loan Management System

Welcome to the **Loan Management System** user guide. This document provides step-by-step instructions for managing capital, borrowers, loans, repayments, and generating analytics reports.

---

## 1. Getting Started & Authentication

### Roles & Permissions
The system supports three user roles with Role-Based Access Control (RBAC):
- **Admin**: Complete system access including capital management, user settings, system preferences, loan disbursal, payments, and reports.
- **Operator**: Day-to-day operations including managing borrowers, creating loans, recording payments, and exporting reports.
- **Viewer**: Read-only access to the dashboard and financial reports.

### Logging In
1. Navigate to `/login`.
2. Enter your registered email address and password.
3. Click **Sign In**. Upon successful verification, you will be directed to the **Dashboard**.

---

## 2. Dashboard & Portfolio Overview

The Dashboard provides real-time financial tracking across four core pillars:

1. **Capital & Available Cash**:
   - *Total Capital Invested*: Cumulative equity/capital injected into the lending business.
   - *Capital Withdrawn*: Total capital withdrawn by lenders/owners.
   - *Net Capital Invested*: `Total Capital Invested - Capital Withdrawn`.
   - *Available Cash to Lend*: Real-time liquidity available for new loan disbursals.

2. **Loan Status & Distribution**:
   - *Total Money Given*: Cumulative principal disbursed across all loans.
   - *Running Loans*: Number of active loans currently within their term.
   - *Overdue Loans*: Number of loans whose due date has passed with an unpaid balance.
   - *Fully Closed Loans*: Total loans fully repaid and settled.
   - *Partially Repaid Loans*: Active loans with partial principal recovered.

3. **Money Collected & Outstanding**:
   - *Total Collected*: Cumulative cash collected (`Principal Collected + Interest Collected`).
   - *Principal Outstanding*: Remaining principal balance awaiting collection.
   - *Interest Outstanding*: Unpaid accrued interest across active/overdue loans.
   - *Total Pending to Collect*: `Principal Outstanding + Interest Outstanding`.

4. **Interest Earnings & Profit**:
   - *Total Expected Interest*: Authoritative accrued interest across all loans.
   - *Interest Profit Earned*: Realized interest revenue received from borrowers.
   - *Interest Left to Collect*: Remaining interest due from borrowers.

---

## 3. Managing Capital (Admin Only)

1. Navigate to **Capital** from the sidebar.
2. Click **Record Transaction** to open the capital modal.
3. Choose the transaction type:
   - **Capital Injection** (`capital_given`): Injects fresh liquidity into the lending pool.
   - **Capital Withdrawal** (`capital_returned`): Records money withdrawn by the owner.
   - **Adjustment**: Manual balance adjustments.
4. Enter the amount, date, source/destination, and description.
5. Click **Save Transaction**. The ledger and running balance will automatically recalculate.

---

## 4. Borrower Management

### Onboarding a New Borrower
1. Navigate to **Borrowers** from the sidebar.
2. Click **Add Borrower**.
3. Fill in the borrower's details:
   - **Full Name** (Required)
   - **Phone Number** (Required, 10 digits, uniqueness enforced)
   - **Email Address** (Optional)
   - **Address** (Optional)
   - **Notes** (Optional)
4. Click **Save Borrower**.

### Viewing Borrower Profile & Credit History
- Click the eye icon or borrower's name in the table to view their complete profile, active loan count, total borrowed, total repaid, and credit statistics.

---

## 5. Loan Disbursal & Management

### Disbursing a New Loan
1. Navigate to **Loans** from the sidebar.
2. Click **Disburse Loan**.
3. Select the borrower from the dropdown.
4. Enter loan terms:
   - **Principal Amount** (₹)
   - **Interest Rate** (%)
   - **Rate Type**:
     - `Monthly`: Completed month interest + pro-rata daily ($\div 30$) reducing balance model.
     - `Daily`: Pure per-day interest rate accrual.
     - `Flat`: Fixed percentage calculation on original principal.
   - **Disbursal Date**: Date money is handed over.
   - **Tenure & Unit**: Duration (days/months/years) to auto-calculate due date.
5. Click **Disburse Loan**.

### Loans Table Columns & Payment Breakdown
The Loans table displays:
- **Principal Received**: Total principal recovered so far.
- **Interest Received**: Total interest recovered, with individual payment breakdown for the first 3 receipts, a `+N more` counter, and an interactive hover popover listing every individual payment transaction.

---

## 6. Repayment & Payment Processing

### Recording a Payment
1. Navigate to **Payments** or click **Record Payment** from a loan row.
2. Enter:
   - **Payment Date**
   - **Payment Amount** (₹)
   - **Allocation Method**:
     - `Interest First` (Default): Pays accrued interest due first; remainder reduces principal.
     - `Principal First`: Pays principal balance first; remainder pays interest.
     - `Proportional`: Splits payment proportionally between principal and interest.
     - `Manual Custom Split`: Allows specifying exact principal/interest breakdown.
   - **Payment Mode**: Cash, UPI, Bank Transfer, Cheque.
   - **Reference / Transaction ID**.
3. Click **Record Payment**.
4. If the total outstanding reaches ₹0, the loan status is **automatically settled and marked completed**.

### Voiding a Payment
- To reverse an erroneous payment, click the **Void** button on the payment row, enter a required void reason, and confirm. All running balances, interest accruals, and loan statuses will immediately roll back.

---

## 7. Reports & Excel Export

1. Navigate to **Reports** from the sidebar.
2. Select a report type:
   - **Capital Statement**: Chronological capital inflows and outflows.
   - **Loan Portfolio Report**: Disbursals, status, interest rates, and balances.
   - **Payment Ledger & Allocation**: Itemized payment breakdown.
   - **Outstanding Balances**: Active delinquency and debt ledger.
   - **Interest Profit Realization**: Monthly interest revenue breakdown.
3. Apply filters (Date range, borrower, payment mode, status).
4. Click **Export to Excel** (`.xlsx`) to download a formatted spreadsheet generated via ExcelJS.

---

## 8. Frequently Asked Questions (FAQ)

**Q: How does monthly interest calculate when principal is repaid partially?**
A: Interest accrues strictly on the active principal. When principal is repaid, that portion stops accruing future interest from that payment date.

**Q: Can a deleted borrower have active loans?**
A: No. The system has integrity guards preventing deletion of borrowers with active or overdue loans.
