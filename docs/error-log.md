# 📜 Error Incident Log

This document serves as the chronological audit log of all recorded technical errors, bugs, exceptions, and resolutions across the lifecycle of the **Loan Management System**.

---

## 📊 Incident Summary Table

| Incident ID | Date | Module | Category | Severity | Status | Short Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| [`ERR-2026-09-01-001`](#err-2026-09-01-001--vite-proxy-econnrefused-on-login) | 2026-09-01 | Authentication | Server / API | **High** | ✅ Resolved | Vite proxy `ECONNREFUSED` on `/api/auth/login` |
| [`ERR-2026-09-01-002`](#err-2026-09-01-002--mysql-er_access_denied_error) | 2026-09-01 | Database | Database / Config | **Critical** | ✅ Resolved | Access denied for MySQL user `root` |
| [`ERR-2026-09-02-001`](#err-2026-09-02-001--mysql2-bind-parameters-contain-undefined) | 2026-09-02 | Capital | Database / Backend | **High** | ✅ Resolved | MySQL2 bind parameters contained `undefined` |
| [`ERR-2026-09-02-002`](#err-2026-09-02-002--date-fns-rangeerror-causing-blank-page) | 2026-09-02 | Capital | Frontend | **High** | ✅ Resolved | `date-fns` RangeError crashed React on `/capital` |
| [`ERR-2026-09-02-003`](#err-2026-09-02-003--subpath-dev-api-routing-404) | 2026-09-02 | Capital / API | Server / API | **Medium** | ✅ Resolved | `404 Function Not Found` on `/api/capital/balance` |
| [`ERR-2026-09-02-004`](#err-2026-09-02-004--date-filter-timezone-shift-discrepancy) | 2026-09-02 | Capital / Database | Database / Frontend | **Medium** | ✅ Resolved | UTC conversion shifted date-only fields by 1 day |
| [`ERR-2026-09-02-006`](#err-2026-09-02-006--excel-bulk-import-transaction-isolation-and-schema-mismatch) | 2026-09-02 | Reports / Import-Export | Database / Backend | **Critical** | ✅ Resolved | Excel bulk import non-atomic commits & borrower schema drift |
| [`ERR-2026-09-02-007`](#err-2026-09-02-007--borrower-directory-total-outstanding-omitted-accrued-interest) | 2026-09-02 | Reports / Financial | Backend / Financial | **High** | ✅ Resolved | Borrower directory `totalOutstanding` omitted loan accrued interest |

---

## 📝 Chronological Incident Entries

---

### ERR-2026-09-01-001 — Vite Proxy ECONNREFUSED on Login

| Field | Details |
| :--- | :--- |
| **Error ID** | `ERR-2026-09-01-001` |
| **Date** | 2026-09-01 |
| **Environment** | Local Development |
| **Module / Feature** | Authentication & Security (`/api/auth/login`) |
| **Error Category** | Server / Hosting / API |
| **Severity** | **High** |
| **Status** | ✅ **Resolved** |
| **Reported By** | User / Rohit |
| **Resolved By** | Antigravity AI |

#### 1. Error Message & Stack Trace
```text
[vite] http proxy error: /auth/login
AggregateError [ECONNREFUSED]: 
    at internalConnectMultiple (node:net:1134:18)
    at afterConnectMultiple (node:net:1715:7)
```

#### 2. Steps to Reproduce
1. Start frontend server with `npm run dev`.
2. Open `http://localhost:5173/login`.
3. Submit credentials to log in.
4. Axios receives a `500 Proxy Error` from Vite because port `9999` is not running.

#### 3. Root Cause Analysis
`vite.config.ts` was configured with an external proxy forwarding `/api/*` to `http://localhost:9999/.netlify/functions`. Since `npm run dev` only starts Vite, port `9999` had no active listener, causing Vite's proxy to fail with `ECONNREFUSED`.

#### 4. Solution & Code Fix
Implemented `netlifyFunctionsDevPlugin()` directly in [`vite.config.ts`](file:///d:/Rohit/LoanManagement/vite.config.ts). Vite now natively intercepts `/api/*` and executes Netlify function handlers in-process using its SSR TypeScript runner.

#### 5. Files Affected
- [`vite.config.ts`](file:///d:/Rohit/LoanManagement/vite.config.ts)
- [`src/pages/Login.tsx`](file:///d:/Rohit/LoanManagement/src/pages/Login.tsx)
- [`src/context/AuthContext.tsx`](file:///d:/Rohit/LoanManagement/src/context/AuthContext.tsx)

#### 6. Prevention & Regression Guards
- Eliminated dual-port dev dependency; running `npm run dev` serves both UI and backend endpoints together.

---

### ERR-2026-09-01-002 — MySQL ER_ACCESS_DENIED_ERROR

| Field | Details |
| :--- | :--- |
| **Error ID** | `ERR-2026-09-01-002` |
| **Date** | 2026-09-01 |
| **Environment** | Local Development |
| **Module / Feature** | Core Database Connection |
| **Error Category** | Database / Configuration |
| **Severity** | **Critical** |
| **Status** | ✅ **Resolved** |
| **Reported By** | User / Rohit |
| **Resolved By** | Antigravity AI |

#### 1. Error Message & Stack Trace
```text
❌ FAILED to connect to MySQL server: ER_ACCESS_DENIED_ERROR
Details: Access denied for user 'root'@'localhost' (using password: YES)
```

#### 2. Steps to Reproduce
1. Attempt database connection using default placeholder password in `.env`.
2. MySQL server rejects handshake due to credential mismatch.

#### 3. Root Cause Analysis
The local MySQL root password on the developer workstation differed from the placeholder password configured in `.env`.

#### 4. Solution & Code Fix
1. Created automated diagnostic tool [`scripts/db-diagnostic.js`](file:///d:/Rohit/LoanManagement/scripts/db-diagnostic.js) to test socket connectivity and handshake authentication.
2. Updated `.env` with developer's actual MySQL root password and ran `npm run db:setup`.

#### 5. Files Affected
- [`.env`](file:///d:/Rohit/LoanManagement/.env)
- [`scripts/db-diagnostic.js`](file:///d:/Rohit/LoanManagement/scripts/db-diagnostic.js)

#### 6. Prevention & Regression Guards
- Diagnostic script provides clear feedback and troubleshooting tips on connection failure.

---

### ERR-2026-09-02-001 — MySQL2 Bind Parameters Contain Undefined

| Field | Details |
| :--- | :--- |
| **Error ID** | `ERR-2026-09-02-001` |
| **Date** | 2026-09-02 |
| **Module / Feature** | Capital Management (`POST /api/capital`) |
| **Error Category** | Backend / Database |
| **Severity** | **High** |
| **Status** | ✅ **Resolved** |
| **Reported By** | User / Rohit |
| **Resolved By** | Antigravity AI |

#### 1. Error Message & Stack Trace
```text
Error: Bind parameters must not contain undefined. To pass SQL NULL specify JS null
    at Connection.execute (node_modules/mysql2/lib/connection.js)
    at CapitalRepository.create (netlify/functions/_lib/repositories/capital.repository.ts)
```

#### 2. Steps to Reproduce
1. Open Capital Management at `http://localhost:5173/capital`.
2. Click "Add Transaction".
3. Enter amount and date, leaving optional fields (source, notes, reference) blank.
4. Click "Record Transaction" -> Backend crashes with bind parameter error.

#### 3. Root Cause Analysis
1. Frontend sent camelCase properties (`transactionDate`, `transactionType`), while repository accessed snake_case keys (`transaction_date`), resulting in `undefined`.
2. Empty optional fields evaluated to `undefined`, which `mysql2` rejects.

#### 4. Solution & Code Fix
1. Updated [`capital.repository.ts`](file:///d:/Rohit/LoanManagement/netlify/functions/_lib/repositories/capital.repository.ts) to support both camelCase and snake_case DTO keys.
2. Normalized all optional values to `null` before passing to SQL prepared statements:
   ```ts
   const txSource = data.source ? String(data.source).trim() : null;
   const txNotes = data.notes ? String(data.notes).trim() : null;
   ```

#### 5. Files Affected
- [`netlify/functions/_lib/repositories/capital.repository.ts`](file:///d:/Rohit/LoanManagement/netlify/functions/_lib/repositories/capital.repository.ts)

#### 6. Prevention & Regression Guards
- Strict null coalescing policy applied to all repository `INSERT` and `UPDATE` queries.

---

### ERR-2026-09-02-002 — date-fns RangeError Causing Blank Page

| Field | Details |
| :--- | :--- |
| **Error ID** | `ERR-2026-09-02-002` |
| **Date** | 2026-09-02 |
| **Environment** | Local Development |
| **Module / Feature** | Capital UI (`/capital`) |
| **Error Category** | Frontend / UI |
| **Severity** | **High** |
| **Status** | ✅ **Resolved** |
| **Reported By** | User / Rohit |
| **Resolved By** | Antigravity AI |

#### 1. Error Message & Stack Trace
```text
RangeError: Invalid time value
    at format (date-fns/format.js:120)
    at CapitalTransactionList (src/components/capital/CapitalTransactionList.tsx:108)
```

#### 2. Steps to Reproduce
1. Navigate to `http://localhost:5173/capital`.
2. Component attempts to render transaction row.
3. `date-fns` `format(new Date(undefined))` throws `RangeError`, crashing React and rendering a blank screen.

#### 4. Root Cause Analysis
The repository returned raw MySQL rows with snake_case `transaction_date`. The frontend table accessed camelCase `tx.transactionDate` which was `undefined`, causing `new Date(undefined)` to produce an invalid date.

#### 5. Solution & Code Fix
1. Implemented `mapDbToCapitalTransaction()` in [`capital.repository.ts`](file:///d:/Rohit/LoanManagement/netlify/functions/_lib/repositories/capital.repository.ts) to normalize database rows into camelCase domain models.
2. Added defensive date parsing in [`CapitalTransactionList.tsx`](file:///d:/Rohit/LoanManagement/src/components/capital/CapitalTransactionList.tsx).
3. Wrapped app routes in [`ErrorBoundary.tsx`](file:///d:/Rohit/LoanManagement/src/components/common/ErrorBoundary.tsx) to prevent full-page unmounting.

#### 6. Files Affected
- [`netlify/functions/_lib/repositories/capital.repository.ts`](file:///d:/Rohit/LoanManagement/netlify/functions/_lib/repositories/capital.repository.ts)
- [`src/components/capital/CapitalTransactionList.tsx`](file:///d:/Rohit/LoanManagement/src/components/capital/CapitalTransactionList.tsx)
- [`src/components/common/ErrorBoundary.tsx`](file:///d:/Rohit/LoanManagement/src/components/common/ErrorBoundary.tsx)
- [`src/App.tsx`](file:///d:/Rohit/LoanManagement/src/App.tsx)

---

### ERR-2026-09-02-003 — Subpath Dev API Routing 404

| Field | Details |
| :--- | :--- |
| **Error ID** | `ERR-2026-09-02-003` |
| **Date** | 2026-09-02 |
| **Environment** | Local Development |
| **Module / Feature** | Serverless API Dev Middleware |
| **Error Category** | Server / API |
| **Severity** | **Medium** |
| **Status** | ✅ **Resolved** |
| **Reported By** | Antigravity AI (Live Diagnostics) |
| **Resolved By** | Antigravity AI |

#### 1. Error Message & Stack Trace
```text
[API Dev] No function found for route: capital/balance
[API Dev] No function found for route: capital/summary
```

#### 2. Steps to Reproduce
1. Frontend queries `GET /api/capital/balance` or `GET /api/capital/summary`.
2. Vite dev plugin searched only for `capital/balance.ts` instead of routing to parent `capital.ts`.
3. Dev server returned `404 Function Not Found`.

#### 3. Root Cause Analysis
The dev server plugin file lookup checked exact subroute file paths and did not check if a parent module (`capital.ts`) was present to handle REST subrouting.

#### 4. Solution & Code Fix
Updated candidate file resolution in [`vite.config.ts`](file:///d:/Rohit/LoanManagement/vite.config.ts) to resolve top-level route handlers (`netlify/functions/${topModule}.ts`).

#### 5. Files Affected
- [`vite.config.ts`](file:///d:/Rohit/LoanManagement/vite.config.ts)

#### 6. Prevention & Regression Guards
- All nested REST subpaths now automatically resolve to top-level module controllers.

---

### ERR-2026-09-02-004 — Date Filter Timezone Shift Discrepancy

| Field | Details |
| :--- | :--- |
| **Error ID** | `ERR-2026-09-02-004` |
| **Date** | 2026-09-02 |
| **Environment** | Local Development |
| **Module / Feature** | Capital Management Date Filter & Display |
| **Error Category** | Database / Frontend |
| **Severity** | **Medium** |
| **Status** | ✅ **Resolved** |
| **Reported By** | User / Rohit |
| **Resolved By** | Antigravity AI |

#### 1. Error Message & Visual Anomaly
```text
Filter selection: 08/12/2026 (From) to 08/12/2026 (To)
Table row rendered: "11 Aug 2026" (Appeared to match the wrong date)
```

#### 2. Steps to Reproduce
1. Create a capital transaction for `2026-08-12`.
2. Apply date filter for `2026-08-12` to `2026-08-12`.
3. Table displays transaction as `11 Aug 2026` instead of `12 Aug 2026`.

#### 3. Root Cause Analysis
1. `mysql2` driver by default cast MySQL `DATE` column (`2026-08-12`) to a JavaScript `Date` object at local midnight (`2026-08-12T00:00:00 IST`).
2. Calling `.toISOString()` shifted the date into UTC (`2026-08-11T18:30:00Z`), rolling back the calendar day to August 11.
3. In `CapitalTransactionList.tsx`, `new Date('2026-08-12')` (ISO date-only string) was also parsed as UTC midnight, rolling back to August 11 in local timezones.
4. As a result, the database query correctly matched `transaction_date = '2026-08-12'`, but the UI rendered it as `11 Aug 2026`.

#### 4. Solution & Code Fix
1. Enabled `dateStrings: true` in MySQL pool configuration in [`database.ts`](file:///d:/Rohit/LoanManagement/netlify/functions/_lib/database.ts) to return exact date strings without timezone degradation.
2. Updated `mapDbToCapitalTransaction()` in [`capital.repository.ts`](file:///d:/Rohit/LoanManagement/netlify/functions/_lib/repositories/capital.repository.ts) to format local calendar date values (`YYYY-MM-DD`).
3. Updated [`CapitalTransactionList.tsx`](file:///d:/Rohit/LoanManagement/src/components/capital/CapitalTransactionList.tsx) to parse `YYYY-MM-DD` strings using local date constructor with noon time (`new Date(y, m - 1, d, 12, 0, 0)`), which is immune to DST and timezone boundary shifts.

#### 5. Files Affected
- [`netlify/functions/_lib/database.ts`](file:///d:/Rohit/LoanManagement/netlify/functions/_lib/database.ts)
- [`netlify/functions/_lib/repositories/capital.repository.ts`](file:///d:/Rohit/LoanManagement/netlify/functions/_lib/repositories/capital.repository.ts)
- [`src/components/capital/CapitalTransactionList.tsx`](file:///d:/Rohit/LoanManagement/src/components/capital/CapitalTransactionList.tsx)

#### 6. Prevention & Regression Guards
- Standardized `dateStrings: true` across all MySQL connection pools.
- Standardized noon-time local parsing for all date-only UI displays.

---

### ERR-2026-09-02-005 — Borrower Creation Undefined Response and Auth Wrapper Invocation

| Field | Details |
| :--- | :--- |
| **Error ID** | `ERR-2026-09-02-005` |
| **Date** | 2026-09-02 |
| **Environment** | Local Development |
| **Module / Feature** | Borrower Management (`POST /api/borrowers`) |
| **Error Category** | Backend / API |
| **Severity** | **High** |
| **Status** | ✅ **Resolved** |
| **Reported By** | User / Rohit |
| **Resolved By** | Antigravity AI |

#### 1. Error Message & Visual Anomaly
```text
Toast notification: Borrower "undefined" (undefined) registered successfully!
Result: No borrower record created in MySQL database.
```

#### 2. Steps to Reproduce
1. Open `http://localhost:5173/borrowers`.
2. Click "Register Borrower".
3. Fill in name, 10-digit phone number, and address.
4. Click "Register Borrower" -> Toast shows `"undefined"` and no database record is inserted.

#### 3. Root Cause Analysis
1. In `netlify/functions/borrowers.ts`, `requireRole()` and `requireAuth()` are higher-order wrapper functions returning an async handler. The endpoint called `const roleCheck = requireRole(...)` as an inline validator, which returned the wrapper function itself. The endpoint returned `roleCheck` directly, resulting in an empty handler response with `statusCode = undefined` and `body = undefined`.
2. In `vite.config.ts`, candidate file resolution matched directory `netlify/functions/borrowers/` via `fs.existsSync()` instead of verifying `fs.statSync(file).isFile()`.

#### 4. Solution & Code Fix
1. Refactored [`borrowers.ts`](file:///d:/Rohit/LoanManagement/netlify/functions/borrowers.ts) to wrap the handler with `requireAuth(async (event: AuthenticatedEvent) => { ... })` and perform inline role checks on `event.user.role`.
2. Removed conflicting folder `netlify/functions/borrowers/`.
3. Updated [`vite.config.ts`](file:///d:/Rohit/LoanManagement/vite.config.ts) to enforce `fs.statSync(file).isFile()`.
4. Adjusted `phoneSchema` in [`validation.ts`](file:///d:/Rohit/LoanManagement/src/utils/validation.ts) to accept all standard 10-digit numbers (`^\d{10}$`).

#### 5. Files Affected
- [`netlify/functions/borrowers.ts`](file:///d:/Rohit/LoanManagement/netlify/functions/borrowers.ts)
- [`vite.config.ts`](file:///d:/Rohit/LoanManagement/vite.config.ts)
- [`src/utils/validation.ts`](file:///d:/Rohit/LoanManagement/src/utils/validation.ts)

#### 6. Prevention & Regression Guards
- Standardized `export const handler = requireAuth(async (event: AuthenticatedEvent) => ...)` pattern across all serverless function files.
- Added live API integration testing to immediately detect empty response payloads.

---

### ERR-2026-09-02-006 — Excel Bulk Import Transaction Isolation and Schema Mismatch

| Field | Details |
| :--- | :--- |
| **Error ID** | `ERR-2026-09-02-006` |
| **Date** | 2026-09-02 |
| **Environment** | Local Development & Production |
| **Module / Feature** | Reports & Excel Import/Export (`excel-import.service.ts`) |
| **Error Category** | Database / Backend |
| **Severity** | **Critical** |
| **Status** | ✅ **Resolved** |
| **Reported By** | Antigravity AI Audit |
| **Resolved By** | Antigravity AI |

#### 1. Error Message & Anomaly
```text
Issue A: Repository create methods instantiated independent transactions via withTransaction(), committing each imported row immediately and bypassing caller's outer transaction.
Issue B: Borrower template contained identityType/identityNumber columns unmapped in MySQL borrowers schema.
```

#### 2. Steps to Reproduce
1. Upload a 10-row Excel import file where rows 1–9 are valid and row 10 fails validation/DB constraints.
2. Observe that without connection reuse, rows 1–9 remained permanently committed in the database despite the batch failure.

#### 3. Root Cause Analysis
1. `borrowerRepository.create()`, `loanRepository.create()`, `paymentRepository.create()`, and `capitalRepository.create()` only accepted `(data, createdBy)` without an optional `connection?: PoolConnection` parameter. They unconditionally invoked `withTransaction()`, opening new connections and immediately committing each row.
2. The borrower Excel template included legacy identity fields not defined in `002_create_borrowers_table.sql`.

#### 4. Solution & Code Fix
1. Refactored all four repository `.create(data, createdBy, connection?: PoolConnection)` methods to reuse the provided transaction connection if passed, and fall back to `withTransaction()` when called standalone.
2. Aligned borrower template, importer validation, and UI template cards to supported schema columns (`fullName`, `phone`, `email`, `address`, `notes`, `status`).
3. Added automated rollback proof in `scripts/test-phase-9.js` verifying exactly 0 rows remain after mid-batch failure.

#### 5. Files Affected
- [`borrower.repository.ts`](file:///d:/Rohit/LoanManagement/netlify/functions/_lib/repositories/borrower.repository.ts)
- [`loan.repository.ts`](file:///d:/Rohit/LoanManagement/netlify/functions/_lib/repositories/loan.repository.ts)
- [`payment.repository.ts`](file:///d:/Rohit/LoanManagement/netlify/functions/_lib/repositories/payment.repository.ts)
- [`capital.repository.ts`](file:///d:/Rohit/LoanManagement/netlify/functions/_lib/repositories/capital.repository.ts)
- [`excel-import.service.ts`](file:///d:/Rohit/LoanManagement/netlify/functions/_lib/services/excel-import.service.ts)
- [`template-generator.service.ts`](file:///d:/Rohit/LoanManagement/netlify/functions/_lib/services/template-generator.service.ts)
- [`ImportExport.tsx`](file:///d:/Rohit/LoanManagement/src/pages/ImportExport.tsx)

#### 6. Prevention & Regression Guards
- Added automated mid-batch failure rollback assertion verifying DB row counts before and after failed imports in `scripts/test-phase-9.js`.

---

### ERR-2026-09-02-007 — Borrower Directory Total Outstanding Omitted Accrued Interest

| Field | Details |
| :--- | :--- |
| **Error ID** | `ERR-2026-09-02-007` |
| **Date** | 2026-09-02 |
| **Environment** | Local Development & Production |
| **Module / Feature** | Reports & Analytics (`getBorrowerReport`) |
| **Error Category** | Financial / Calculation Consistency |
| **Severity** | **High** |
| **Status** | ✅ **Resolved** |
| **Reported By** | Antigravity AI Financial Audit |
| **Resolved By** | Antigravity AI |

#### 1. Error Message & Anomaly
```text
Discrepancy: Borrower Directory calculated totalOutstanding = totalBorrowed - principalRepaid (Principal only), omitting active loan accrued/pending interest and diverging from Loan Portfolio and Outstanding Balances reports.
```

#### 2. Steps to Reproduce
1. Open `/reports` and select "Borrower Directory".
2. Open "Loan Portfolio" or "Outstanding Balances" in another tab.
3. Compare the Total Outstanding for a borrower with active interest-bearing loans.
4. The Borrower Directory displayed only remaining principal, whereas the portfolio displayed Principal + Accrued Interest.

#### 3. Root Cause Analysis
In `reportRepository.getBorrowerReport()`, `totalOutstanding` was assigned directly to `principalOutstanding` (`totalBorrowed - principalRepaid`). This did not sum the canonical `loanRepository.calculateOutstanding().totalOutstanding` across the borrower's active loans.

#### 4. Solution & Code Fix
1. Refactored `getBorrowerReport()` to retain `principalOutstanding` as principal-only (`totalBorrowed - principalRepaid`) while calculating `totalOutstanding` as the sum of `loanRepository.calculateOutstanding(loan.id, conn).totalOutstanding` across all non-deleted, active/overdue loans for each borrower.
2. Updated UI table [`ReportTable.tsx`](file:///d:/Rohit/LoanManagement/src/components/reports/ReportTable.tsx), [`ReportSummaryCards.tsx`](file:///d:/Rohit/LoanManagement/src/components/reports/ReportSummaryCards.tsx), and Excel export columns in [`excel-export.service.ts`](file:///d:/Rohit/LoanManagement/netlify/functions/_lib/services/excel-export.service.ts) to display both `Principal Due (₹)` and `Total Pending (₹)`.
3. Added automated cross-report assertion in `scripts/test-phase-9.js` verifying exact numerical match across 7 financial scenarios.

#### 5. Files Affected
- [`report.repository.ts`](file:///d:/Rohit/LoanManagement/netlify/functions/_lib/repositories/report.repository.ts)
- [`excel-export.service.ts`](file:///d:/Rohit/LoanManagement/netlify/functions/_lib/services/excel-export.service.ts)
- [`ReportTable.tsx`](file:///d:/Rohit/LoanManagement/src/components/reports/ReportTable.tsx)
- [`ReportSummaryCards.tsx`](file:///d:/Rohit/LoanManagement/src/components/reports/ReportSummaryCards.tsx)
- [`scripts/test-phase-9.js`](file:///d:/Rohit/LoanManagement/scripts/test-phase-9.js)

#### 6. Prevention & Regression Guards
- Added cross-report numerical equivalence test comparing `Borrower.totalOutstanding` to `SUM(Loan.totalOutstanding)` across all borrowers in `scripts/test-phase-9.js`.


