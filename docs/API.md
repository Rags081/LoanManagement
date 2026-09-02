# 📡 API Documentation

Base URL: `/api`  
Content-Type: `application/json`

---

## 🔐 Authentication Endpoints

### 1. User Login
- **Endpoint**: `POST /api/auth/login`
- **Access**: Public (Rate limited: 5 req / 15 min / IP)
- **Request Body**:
  ```json
  {
    "email": "admin@loanmanagement.com",
    "password": "Admin@123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@loanmanagement.com",
      "fullName": "System Administrator",
      "role": "admin",
      "isActive": true,
      "lastLoginAt": "2026-09-01T21:00:00.000Z",
      "createdAt": "2026-09-01T20:50:00.000Z",
      "updatedAt": "2026-09-01T21:00:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Validation error
  - `401 Unauthorized`: Invalid email or password
  - `403 Forbidden`: Account deactivated
  - `429 Too Many Requests`: Rate limit exceeded

---

### 2. User Logout
- **Endpoint**: `POST /api/auth/logout`
- **Access**: Authenticated (`Bearer <token>`)
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

---

### 3. Verify Session & Profile
- **Endpoint**: `GET /api/auth/verify`
- **Access**: Authenticated (`Bearer <token>`)
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "valid": true,
    "user": {
      "id": 1,
      "email": "admin@loanmanagement.com",
      "fullName": "System Administrator",
      "role": "admin",
      "isActive": true,
      "lastLoginAt": "2026-09-01T21:00:00.000Z",
      "createdAt": "2026-09-01T20:50:00.000Z",
      "updatedAt": "2026-09-01T21:00:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Missing or invalid token
  - `403 Forbidden`: Token expired

---

### 4. Change Password
- **Endpoint**: `POST /api/auth/change-password`
- **Access**: Authenticated (`Bearer <token>`)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "currentPassword": "Admin@123",
    "newPassword": "NewSecurePassword@456"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Password changed successfully"
  }
  ```

---

### 5. Forgot Password
- **Endpoint**: `POST /api/auth/forgot-password`
- **Access**: Public (Rate limited)
- **Request Body**:
  ```json
  {
    "email": "admin@loanmanagement.com"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "If an account exists with this email, a password reset link has been sent."
  }
  ```

---

### 6. Reset Password
- **Endpoint**: `POST /api/auth/reset-password`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "newPassword": "NewPassword@789"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Password has been reset successfully. Please log in with your new password."
  }
  ```

---

## 🏛️ Capital Management Endpoints

### 1. List Capital Transactions
- **Endpoint**: `GET /api/capital`
- **Access**: Authenticated (`admin`, `operator`)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `transactionType`: Filter (`all`, `capital_given`, `capital_returned`, `adjustment`)
  - `startDate`: Filter transactions on or after YYYY-MM-DD
  - `endDate`: Filter transactions on or before YYYY-MM-DD
  - `search`: Keyword search in ID, description, ref, source, destination
- **Response (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": 1,
        "transactionId": "CAP-001",
        "transactionDate": "2026-09-01",
        "transactionType": "capital_given",
        "amount": 500000,
        "source": "HDFC Primary Bank",
        "destination": "Operator Cash Pool",
        "description": "Initial capital deposit",
        "referenceNumber": "UTR99887766",
        "notes": "Q3 Lending fund",
        "runningBalance": 500000,
        "createdBy": 1,
        "creatorName": "System Administrator",
        "createdAt": "2026-09-01T20:00:00.000Z",
        "updatedAt": "2026-09-01T20:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
  ```

---

### 2. Get Single Capital Transaction
- **Endpoint**: `GET /api/capital/:id`
- **Access**: Authenticated (`admin`, `operator`, `viewer`)
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "id": 1,
    "transactionId": "CAP-001",
    "transactionDate": "2026-09-01",
    "transactionType": "capital_given",
    "amount": 500000,
    "source": "HDFC Primary Bank",
    "destination": "Operator Cash Pool",
    "description": "Initial capital deposit",
    "referenceNumber": "UTR99887766",
    "notes": "Q3 Lending fund",
    "runningBalance": 500000,
    "createdBy": 1,
    "creatorName": "System Administrator",
    "createdAt": "2026-09-01T20:00:00.000Z",
    "updatedAt": "2026-09-01T20:00:00.000Z"
  }
  ```

---

### 3. Create Capital Transaction
- **Endpoint**: `POST /api/capital`
- **Access**: Authenticated (`admin` only)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "transactionDate": "2026-09-01",
    "transactionType": "capital_given",
    "amount": 500000,
    "source": "HDFC Primary Bank",
    "destination": "Operator Cash Pool",
    "description": "Initial capital deposit",
    "referenceNumber": "UTR99887766",
    "notes": "Optional remarks"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": 1,
    "transactionId": "CAP-001",
    "transactionDate": "2026-09-01",
    "transactionType": "capital_given",
    "amount": 500000,
    "runningBalance": 500000,
    "createdBy": 1,
    "createdAt": "2026-09-01T20:00:00.000Z"
  }
  ```

---

### 4. Update Capital Transaction
- **Endpoint**: `PUT /api/capital/:id`
- **Access**: Authenticated (`admin` only)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "amount": 550000,
    "description": "Updated deposit amount"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "id": 1,
    "transactionId": "CAP-001",
    "amount": 550000,
    "runningBalance": 550000,
    "updatedAt": "2026-09-01T20:30:00.000Z"
  }
  ```

---

### 5. Soft Delete Capital Transaction
- **Endpoint**: `DELETE /api/capital/:id`
- **Access**: Authenticated (`admin` only)
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Capital transaction #1 deleted successfully"
  }
  ```

---

### 6. Get Capital Balance Summary
- **Endpoint**: `GET /api/capital/balance`
- **Access**: Authenticated (`admin`, `operator`, `viewer`)
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "totalGiven": 1000000,
    "totalReturned": 250000,
    "currentBalance": 750000,
    "transactionCount": 8,
    "lastUpdated": "2026-09-01T21:00:00.000Z"
  }
  ```

---

### 7. Get Monthly Capital Analytics Summary
- **Endpoint**: `GET /api/capital/summary?year=2026`
- **Access**: Authenticated (`admin`, `operator`)
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  [
    {
      "period": "2026-08",
      "given": 500000,
      "returned": 100000,
      "netFlow": 400000
    },
    {
      "period": "2026-09",
      "given": 200000,
      "returned": 50000,
      "netFlow": 150000
    }
  ]
  ```

---

## 👥 Borrower Management Endpoints

### 1. List Borrowers (with pagination & filters)
- **Endpoint**: `GET /api/borrowers?page=1&limit=10&status=active&search=Amit`
- **Access**: Authenticated (`admin`, `operator`, `viewer`)
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": 1,
        "borrowerId": "BOR-001",
        "fullName": "Amit Sharma",
        "phone": "9876543210",
        "email": "amit@example.com",
        "address": "Sector 14, Gurugram, Haryana",
        "notes": "Verified Aadhaar card",
        "status": "active",
        "createdBy": 1,
        "creatorName": "System Administrator",
        "createdAt": "2026-09-02T00:00:00.000Z",
        "updatedAt": "2026-09-02T00:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
  ```

---

### 2. Autocomplete Search Borrowers
- **Endpoint**: `GET /api/borrowers/search?q=Amit&limit=10`
- **Access**: Authenticated (`admin`, `operator`, `viewer`)
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "borrowerId": "BOR-001",
      "fullName": "Amit Sharma",
      "phone": "9876543210"
    }
  ]
  ```

---

### 3. Get Single Borrower with Credit Stats & Loan History
- **Endpoint**: `GET /api/borrowers/:id`
- **Access**: Authenticated (`admin`, `operator`, `viewer`)
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "id": 1,
    "borrowerId": "BOR-001",
    "fullName": "Amit Sharma",
    "phone": "9876543210",
    "email": "amit@example.com",
    "address": "Sector 14, Gurugram",
    "status": "active",
    "stats": {
      "totalLoans": 2,
      "activeLoans": 1,
      "completedLoans": 1,
      "totalPrincipalBorrowed": 100000,
      "totalPrincipalRepaid": 60000,
      "totalInterestPaid": 12000,
      "totalOutstanding": 40000
    },
    "loans": [
      {
        "id": 1,
        "loanId": "LN-001",
        "principalAmount": 50000,
        "interestRate": 3.0,
        "interestRateType": "monthly",
        "tenure": 6,
        "tenureUnit": "months",
        "loanGivenDate": "2026-08-01",
        "dueDate": "2027-02-01",
        "totalExpectedRepayment": 59000,
        "status": "active",
        "totalPaid": 19000,
        "outstandingBalance": 40000
      }
    ]
  }
  ```

---

### 4. Create Borrower
- **Endpoint**: `POST /api/borrowers`
- **Access**: Authenticated (`admin`, `operator`)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "fullName": "Ramesh Kumar",
    "phone": "9812345678",
    "email": "ramesh@example.com",
    "address": "Civil Lines, Delhi",
    "notes": "Referred by Suresh",
    "status": "active"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": 2,
    "borrowerId": "BOR-002",
    "fullName": "Ramesh Kumar",
    "phone": "9812345678",
    "status": "active",
    "createdBy": 1,
    "createdAt": "2026-09-02T00:30:00.000Z"
  }
  ```

---

### 5. Update Borrower
- **Endpoint**: `PUT /api/borrowers/:id`
- **Access**: Authenticated (`admin`, `operator`)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "fullName": "Ramesh Kumar",
    "phone": "9812345678",
    "status": "blacklisted",
    "notes": "Defaulted on external commitment"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "id": 2,
    "borrowerId": "BOR-002",
    "fullName": "Ramesh Kumar",
    "status": "blacklisted",
    "updatedAt": "2026-09-02T00:35:00.000Z"
  }
  ```

---

### 6. Soft Delete Borrower
- **Endpoint**: `DELETE /api/borrowers/:id`
- **Access**: Authenticated (`admin` only)
- **Headers**: `Authorization: Bearer <token>`
- **Constraint**: Cannot delete borrower with active or overdue loans.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Borrower #2 deleted successfully"
  }
  ```

---

## 💰 Loan Management Endpoints

### 1. List Loans (Paginated with Filters)
- **Endpoint**: `GET /api/loans`
- **Access**: Authenticated (`admin`, `operator`, `viewer`)
- **Query Parameters**:
  - `page` (default: 1)
  - `limit` (default: 10, max: 100)
  - `status` (`active`, `overdue`, `completed`, `cancelled`, `all`)
  - `borrowerId` (filter by borrower ID)
  - `startDate` / `endDate` (disbursal date range `YYYY-MM-DD`)
  - `search` (matches `loan_id`, `borrower_name`, `borrower_phone`, `borrower_id`)
- **Response (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": 1,
        "loanId": "LN-001",
        "borrowerId": 1,
        "borrowerName": "Suresh Kumar",
        "borrowerPhone": "9888877777",
        "borrowerIdCode": "BOR-001",
        "principalAmount": 50000,
        "interestRate": 3,
        "interestRateType": "monthly",
        "tenure": 6,
        "tenureUnit": "months",
        "loanGivenDate": "2026-08-01",
        "dueDate": "2027-02-01",
        "totalExpectedInterest": 9000,
        "totalExpectedRepayment": 59000,
        "status": "active",
        "creatorName": "System Administrator",
        "createdAt": "2026-09-02T01:10:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
  ```

---

### 2. Loan Portfolio Summary
- **Endpoint**: `GET /api/loans/summary`
- **Access**: Authenticated (`admin`, `operator`, `viewer`)
- **Response (200 OK)**:
  ```json
  {
    "totalLoans": 4,
    "activeLoans": 3,
    "overdueLoans": 1,
    "completedLoans": 0,
    "cancelledLoans": 0,
    "totalPrincipalLent": 120000,
    "totalExpectedInterest": 18300,
    "totalExpectedRepayment": 138300,
    "totalPrincipalRecovered": 0,
    "totalInterestRecovered": 0,
    "totalOutstanding": 138300
  }
  ```

---

### 3. Get Single Loan Details
- **Endpoint**: `GET /api/loans/:id`
- **Access**: Authenticated (`admin`, `operator`, `viewer`)
- **Response (200 OK)**:
  ```json
  {
    "id": 1,
    "loanId": "LN-001",
    "borrowerId": 1,
    "borrowerName": "Suresh Kumar",
    "principalAmount": 50000,
    "interestRate": 3,
    "interestRateType": "monthly",
    "tenure": 6,
    "tenureUnit": "months",
    "loanGivenDate": "2026-08-01",
    "dueDate": "2027-02-01",
    "totalExpectedInterest": 9000,
    "totalExpectedRepayment": 59000,
    "status": "active",
    "borrower": {
      "id": 1,
      "borrowerId": "BOR-001",
      "fullName": "Suresh Kumar",
      "phone": "9888877777"
    },
    "outstanding": {
      "principalAmount": 50000,
      "principalReceived": 0,
      "principalOutstanding": 50000,
      "interestExpected": 9000,
      "interestReceived": 0,
      "interestOutstanding": 9000,
      "totalExpected": 59000,
      "totalReceived": 0,
      "totalOutstanding": 59000,
      "isOverdue": false,
      "daysOverdue": 0
    },
    "payments": []
  }
  ```

---

### 4. Get Loan Payments
- **Endpoint**: `GET /api/loans/:id/payments`
- **Access**: Authenticated (`admin`, `operator`, `viewer`)
- **Response (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "payment_id": "PAY-001",
      "payment_date": "2026-08-15",
      "payment_amount": 5000,
      "principal_portion": 4000,
      "interest_portion": 1000,
      "payment_mode": "upi",
      "is_void": false
    }
  ]
  ```

---

### 5. Get Loan Outstanding Calculation
- **Endpoint**: `GET /api/loans/:id/outstanding`
- **Access**: Authenticated (`admin`, `operator`, `viewer`)
- **Response (200 OK)**:
  ```json
  {
    "principalAmount": 50000,
    "principalReceived": 5000,
    "principalOutstanding": 45000,
    "interestExpected": 9000,
    "interestReceived": 1000,
    "interestOutstanding": 8000,
    "totalExpected": 59000,
    "totalReceived": 6000,
    "totalOutstanding": 53000,
    "isOverdue": false,
    "daysOverdue": 0
  }
  ```

---

### 6. Create / Disburse Loan
- **Endpoint**: `POST /api/loans`
- **Access**: Authenticated (`admin`, `operator`)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "borrowerId": 1,
    "principalAmount": 50000,
    "interestRate": 3,
    "interestRateType": "monthly",
    "tenure": 6,
    "tenureUnit": "months",
    "loanGivenDate": "2026-08-01",
    "notes": "Expansion loan"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": 1,
    "loanId": "LN-001",
    "borrowerId": 1,
    "principalAmount": 50000,
    "interestRate": 3,
    "interestRateType": "monthly",
    "tenure": 6,
    "tenureUnit": "months",
    "loanGivenDate": "2026-08-01",
    "dueDate": "2027-02-01",
    "totalExpectedInterest": 9000,
    "totalExpectedRepayment": 59000,
    "status": "active"
  }
  ```

---

### 7. Update Loan Terms
- **Endpoint**: `PUT /api/loans/:id`
- **Access**: Authenticated (`admin`, `operator`)
- **Request Body**:
  ```json
  {
    "interestRate": 2.5,
    "notes": "Reduced rate after negotiation"
  }
  ```
- **Response (200 OK)**: Returns updated loan with recalculated expected interest & repayment.

---

### 8. Override / Update Loan Status
- **Endpoint**: `POST /api/loans/:id/status`
- **Access**: Authenticated (`admin` only)
- **Request Body**:
  ```json
  {
    "status": "overdue"
  }
  ```
- **Response (200 OK)**: Returns updated loan object with new status.

---

### 9. Soft Delete Loan
- **Endpoint**: `DELETE /api/loans/:id`
- **Access**: Authenticated (`admin` only)
- **Constraint**: Throws error if any recorded payment exists for this loan.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Loan #1 deleted successfully"
  }
  ```

---

## 💳 Payment Endpoints

### 1. List Payments (Paginated with Filters)
- **Endpoint**: `GET /api/payments`
- **Access**: Authenticated (`admin`, `operator`, `viewer`)
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `loanId`: Filter by specific loan ID
  - `borrowerId`: Filter by borrower ID
  - `paymentMode`: `cash` | `upi` | `bank_transfer` | `other` | `all`
  - `isVoid`: `true` | `false`
  - `startDate`: Filter payments on or after `YYYY-MM-DD`
  - `endDate`: Filter payments on or before `YYYY-MM-DD`
  - `search`: Keyword matching payment ID, loan ID, borrower name, phone, or reference number
- **Response (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": 1,
        "paymentId": "PAY-001",
        "loanId": 1,
        "loanCustomId": "LN-001",
        "borrowerName": "Rajesh Kumar",
        "borrowerPhone": "+91 9876543210",
        "paymentDate": "2026-02-10",
        "paymentAmount": 10000,
        "principalPortion": 8500,
        "interestPortion": 1500,
        "paymentMode": "upi",
        "referenceNumber": "UPI-12345678",
        "isVoid": false,
        "createdBy": 1,
        "creatorName": "System Administrator",
        "createdAt": "2026-02-10T10:30:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
  ```

---

### 2. Payment Summary Metrics
- **Endpoint**: `GET /api/payments/summary`
- **Access**: Authenticated (`admin`, `operator`, `viewer`)
- **Query Parameters**: Same filters as `GET /api/payments` (for real-time filter synchronization)
- **Response (200 OK)**:
  ```json
  {
    "totalPayments": 12,
    "totalCollected": 125000,
    "principalCollected": 95000,
    "interestCollected": 30000,
    "collectedThisMonth": 25000,
    "voidedPaymentsCount": 1,
    "voidedAmount": 10000
  }
  ```

---

### 3. Get Single Payment Details
- **Endpoint**: `GET /api/payments/:id`
- **Access**: Authenticated (`admin`, `operator`, `viewer`)
- **Response (200 OK)**: Returns payment with allocation breakdown and loan metadata.

---

### 4. Get Payments by Loan
- **Endpoint**: `GET /api/payments/loan/:loanId`
- **Access**: Authenticated (`admin`, `operator`, `viewer`)
- **Response (200 OK)**: Array of all valid and voided payments for the specified loan.

---

### 5. Get Total Received by Loan
- **Endpoint**: `GET /api/payments/loan/:loanId/total`
- **Access**: Authenticated (`admin`, `operator`, `viewer`)
- **Response (200 OK)**:
  ```json
  {
    "total": 25000,
    "principalTotal": 20000,
    "interestTotal": 5000
  }
  ```

---

### 6. Get Payment Modes
- **Endpoint**: `GET /api/payments/modes`
- **Access**: Authenticated
- **Response (200 OK)**:
  ```json
  [
    { "value": "cash", "label": "Cash Payment" },
    { "value": "upi", "label": "UPI / QR Transfer (GPay, PhonePe, Paytm)" },
    { "value": "bank_transfer", "label": "Direct Bank Account Transfer (NEFT/IMPS/RTGS)" },
    { "value": "other", "label": "Other Method / Cheque" }
  ]
  ```

---

### 7. Record Repayment
- **Endpoint**: `POST /api/payments`
- **Access**: Authenticated (`admin`, `operator`)
- **Request Body**:
  ```json
  {
    "loanId": 1,
    "paymentDate": "2026-02-10",
    "paymentAmount": 10000,
    "paymentMode": "upi",
    "referenceNumber": "UPI-12345678",
    "allocationMethod": "interest_first",
    "notes": "February installment"
  }
  ```
- **Response (201 Created)**: Returns created payment record and triggers automatic loan settlement if balance is zero.

---

### 8. Void Payment Transaction
- **Endpoint**: `POST /api/payments/:id/void`
- **Access**: Authenticated (`admin` only)
- **Request Body**:
  ```json
  {
    "voidReason": "Cheque bounced / Duplicate entry error"
  }
  ```
- **Response (200 OK)**: Marks payment as void, reverses balances, restores loan status to `active` if previously completed, and logs audit trail.

---

## 📊 Dashboard & Analytics Endpoints

### 1. Get Unified Dashboard Metrics
- **Endpoint**: `GET /api/dashboard/metrics`
- **Access**: Authenticated (`admin`, `operator`, `viewer`)
- **Response (200 OK)**:
  ```json
  {
    "capital": {
      "totalGiven": 25000,
      "totalReturned": 500,
      "currentBalance": 24500,
      "unallocated": 14500
    },
    "loans": {
      "totalLoans": 12,
      "activeLoans": 8,
      "overdueLoans": 1,
      "completedLoans": 3,
      "cancelledLoans": 0,
      "partiallyPaidLoans": 4,
      "totalLent": 450000
    },
    "collections": {
      "totalPrincipalReceived": 120000,
      "totalInterestReceived": 35000,
      "totalAmountReceived": 155000,
      "outstandingPrincipal": 330000,
      "outstandingInterest": 45000,
      "totalOutstanding": 375000
    },
    "profit": {
      "expectedInterest": 80000,
      "realizedInterest": 35000,
      "pendingInterest": 45000
    },
    "registeredBorrowersCount": 15
  }
  ```

---

### 2. Get Time-Series Trends for Charts
- **Endpoint**: `GET /api/dashboard/trends`
- **Access**: Authenticated (`admin`, `operator`, `viewer`)
- **Query Parameters**:
  - `period`: `monthly` (12m) | `weekly` (12w) | `daily` (30d)
- **Response (200 OK)**:
  ```json
  {
    "period": "monthly",
    "loans": [
      { "period": "2026-01", "count": 3, "amount": 150000 },
      { "period": "2026-02", "count": 5, "amount": 220000 }
    ],
    "collections": [
      { "period": "2026-01", "principal": 30000, "interest": 8000, "total": 38000 },
      { "period": "2026-02", "principal": 45000, "interest": 12000, "total": 57000 }
    ],
    "outstanding": [
      { "period": "2026-01", "outstanding": 120000 },
      { "period": "2026-02", "outstanding": 295000 }
    ]
  }
  ```

---

### 3. Get Recent Audit Activity
- **Endpoint**: `GET /api/dashboard/recent-activity`
- **Access**: Authenticated (`admin`, `operator`, `viewer`)
- **Query Parameters**:
  - `limit`: Number of activity records (default: 10)
- **Response (200 OK)**:
  ```json
  [
    {
      "id": 45,
      "timestamp": "2026-02-15T14:22:00.000Z",
      "action": "CREATE",
      "entity": "payment",
      "entityId": "12",
      "user": "System Administrator",
      "details": "Repayment of ₹10,000 recorded for loan #5"
    }
  ]
  ```

---

### 4. Get Overdue Loan Alerts
- **Endpoint**: `GET /api/dashboard/overdue`
- **Access**: Authenticated (`admin`, `operator`, `viewer`)
- **Response (200 OK)**:
  ```json
  [
    {
      "id": 3,
      "loanId": "LN-003",
      "borrowerName": "Sunil Verma",
      "borrowerPhone": "+91 9123456780",
      "principalAmount": 40000,
      "totalOutstanding": 40000,
      "dueDate": "2026-02-01",
      "daysOverdue": 14
    }
  ]
  ```

---

## 📑 Reports & Financial Statements Endpoints

### 1. Capital Statement Report
- **Endpoint**: `GET /api/reports/capital-statement`
- **Access**: Authenticated (`admin`, `operator`)
- **Query Parameters**: `startDate`, `endDate`, `search`
- **Response (200 OK)**: Returns list of capital ledger transactions with live running balance.

---

### 2. Loan Portfolio Report
- **Endpoint**: `GET /api/reports/loan-report`
- **Access**: Authenticated (`admin`, `operator`, `viewer`)
- **Query Parameters**: `startDate`, `endDate`, `status`, `borrowerId`, `search`
- **Response (200 OK)**: Returns loan contracts with calculated reducing principal, paid amounts, and live outstanding balances.

---

### 3. Borrower Directory Report
- **Endpoint**: `GET /api/reports/borrower-report`
- **Access**: Authenticated (`admin`, `operator`, `viewer`)
- **Query Parameters**: `search`
- **Response (200 OK)**: Returns borrower list with borrowing stats, loan counts, and total credit outstanding.

---

### 4. Payment Collections Report
- **Endpoint**: `GET /api/reports/payment-report`
- **Access**: Authenticated (`admin`, `operator`, `viewer`)
- **Query Parameters**: `startDate`, `endDate`, `paymentMode`, `status`, `loanId`, `borrowerId`, `search`
- **Response (200 OK)**: Returns repayments with allocation breakdown (Principal vs Interest) and void metadata.

---

### 5. Outstanding Portfolio Report
- **Endpoint**: `GET /api/reports/outstanding`
- **Access**: Authenticated (`admin`, `operator`, `viewer`)
- **Response (200 OK)**: Active loans ranked by pending balances.

---

### 6. Overdue Delinquency Report
- **Endpoint**: `GET /api/reports/overdue`
- **Access**: Authenticated (`admin`, `operator`, `viewer`)
- **Response (200 OK)**: Overdue loans sorted by maximum days overdue.

---

### 7. Interest & Profit Realization Report
- **Endpoint**: `GET /api/reports/interest`
- **Access**: Authenticated (`admin`, `operator`)
- **Response (200 OK)**: Target expected interest vs cash in hand realized interest vs pending interest.

---

### 8. Monthly Collection Summary Report
- **Endpoint**: `GET /api/reports/monthly-collection`
- **Access**: Authenticated (`admin`, `operator`)
- **Query Parameters**: `year` (e.g. `2026`)
- **Response (200 OK)**: Month-by-month financial collections grouped by principal, interest, and payment count.

---

## 📤 Excel & CSV Export Endpoints

### 1. Export Report to Styled Excel (.xlsx)
- **Endpoint**: `GET /api/export/:reportType/excel`
- **Supported Report Types**: `capital-statement`, `loan-report`, `borrower-report`, `payment-report`, `outstanding-report`, `overdue-report`, `interest-report`, `monthly-collection`
- **Access**: Authenticated
- **Response**: Binary Excel `.xlsx` file with professional navy header styling, auto-width columns, currency formatting, and totals row.

---

### 2. Export Report to CSV (.csv)
- **Endpoint**: `GET /api/export/:reportType/csv`
- **Access**: Authenticated
- **Response**: `text/csv; charset=utf-8` file.

---

## 📥 Excel Bulk Import & Migration Endpoints

### 1. Download Import Template (.xlsx)
- **Endpoint**: `GET /api/import/template?type=borrowers|loans|payments|capital`
- **Access**: Authenticated
- **Response**: Pre-formatted `.xlsx` template with instructions and sample row.

---

### 2. Bulk Import Excel Data
- **Endpoint**: `POST /api/import/:importType`
- **Supported Types**: `borrowers`, `loans`, `payments`, `capital`
- **Access**: Authenticated (`admin`, `operator`)
- **Request Body**:
  ```json
  {
    "fileBase64": "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,UEsDBBQAAAA..."
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "totalRows": 25,
    "importedCount": 25,
    "errorCount": 0,
    "errors": [],
    "message": "Successfully imported 25 record(s)!"
  }
  ```
- **Validation Failure (422 Unprocessable Entity)**:
  ```json
  {
    "success": false,
    "totalRows": 10,
    "importedCount": 0,
    "errorCount": 2,
    "errors": [
      { "row": 4, "field": "phone", "message": "Valid 10+ digit Phone number is required" }
    ],
    "message": "Validation failed with 2 error(s). No records were imported."
  }
  ```





