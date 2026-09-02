# 🛠️ Error & Troubleshooting Documentation

This document defines the error handling protocol, categorization standards, troubleshooting playbooks, and documentation templates for the **Loan Management System**.

---

## 🎯 1. Purpose

The purpose of this guide is to:
1. Establish a standardized methodology for discovering, diagnosing, documenting, and resolving technical errors across frontend, backend, database, and infrastructure layers.
2. Prevent recurring regressions by enforcing root cause analyses (RCA) and preventive coding patterns.
3. Provide engineers and operators with a fast-lookup troubleshooting playbook for known issues.

---

## 📋 2. Error Documentation Rules

When logging or investigating an error, engineers must adhere to the following documentation standards:

1. **Unique Error Identifier**: Every recorded issue must have an ID formatted as `ERR-YYYY-MM-DD-NNN` (e.g., `ERR-2026-09-02-001`).
2. **Immutable Error Capture**: The exact error message, stack trace, and HTTP status code must be recorded in code fences without paraphrasing.
3. **Environment Isolation**: Specify whether the issue occurred in `Local Development`, `Staging`, or `Production`.
4. **Reproducibility Steps**: Document clear, deterministic steps to reproduce the defect.
5. **Root Cause Analysis (RCA)**: Explain the fundamental underlying reason why the system failed (not just the symptom).
6. **Resolution Details**: Describe the architectural fix, code modifications, and configuration changes applied.
7. **Regression Prevention**: Note automated tests, lint rules, type guards, or architectural patterns introduced to prevent reoccurrence.
8. **Cross-Referencing**: Link the error entry to [`docs/error-log.md`](file:///d:/Rohit/LoanManagement/docs/error-log.md).

---

## 🏷️ 3. Error Categories

| Category | Domain & Scope | Common Examples |
| :--- | :--- | :--- |
| **Backend** | Netlify serverless function handlers, business logic, payload processing | Uncaught exceptions, DTO parsing failures, validation rejections |
| **Frontend** | React components, custom hooks, form handling, UI rendering | Component crash, hook dependency loop, blank screen render |
| **Database** | MySQL server, connection pooling, queries, schema migrations | `ER_ACCESS_DENIED`, connection timeout, constraint violation, foreign key errors |
| **API** | Axios client, REST HTTP methods, interceptors, CORS, headers | `404 Not Found`, `405 Method Not Allowed`, missing `Bearer` token |
| **Authentication / Authorization** | JWT signing/verification, bcrypt hashing, RBAC route guards | `401 Unauthorized`, `403 Forbidden`, expired reset token, session mismatch |
| **Deployment** | Netlify build pipeline, continuous integration, static output | Bundle failure, asset resolution error, serverless bundling error |
| **Server / Hosting** | Dev server port binding, proxy routing, reverse proxy | `ECONNREFUSED`, port conflict, proxy gateway error |
| **Configuration / Environment** | Environment variables, `.env` files, config files | Missing `JWT_SECRET`, incorrect `DB_HOST`, invalid port configuration |
| **Build / Dependency** | TypeScript compiler, ESLint linter, Vite bundler, npm dependencies | `TS2322` type mismatch, ESLint unused-var warning, package vulnerability |
| **Performance** | Latency, memory utilization, bundle size, re-render cascades | Unindexed query, missing React memoization, excessive chunk size |
| **Security** | Rate limiting, brute-force mitigation, SQL injection prevention | `429 Too Many Requests`, unescaped query parameter, credential leak |

---

## 🚨 4. Severity Levels

| Severity | Definition | SLA / Response | Action Required |
| :--- | :--- | :--- | :--- |
| **Critical** | System is down, core authentication is broken, or data corruption risk exists | Immediate (< 1 hour) | Hotfix, immediate deployment, root-cause post-mortem |
| **High** | Major module inoperable (e.g. Capital or Loan creation failing), financial calculation mismatch | High (< 4 hours) | Prioritize above new feature work, deploy hotfix |
| **Medium** | Non-blocking functional defect, filter anomaly, non-fatal API error | Standard (< 24 hours) | Scheduled bug fix in current development cycle |
| **Low** | Minor UI styling glitch, non-critical warning, console log omission | Low (Next sprint) | Polish / code cleanup |

---

## 📝 5. Error Entry Template

Use the template below when documenting new errors in [`docs/error-log.md`](file:///d:/Rohit/LoanManagement/docs/error-log.md):

```markdown
### ERR-YYYY-MM-DD-NNN — [Short Descriptive Title]

| Field | Details |
| :--- | :--- |
| **Error ID** | `ERR-YYYY-MM-DD-NNN` |
| **Date** | YYYY-MM-DD |
| **Environment** | Local Development / Staging / Production |
| **Module / Feature** | e.g. Authentication / Capital / Database |
| **Error Category** | Backend / Frontend / Database / API / Security |
| **Severity** | Critical / High / Medium / Low |
| **Status** | Resolved / Investigating / Closed |
| **Reported By** | Name / Role |
| **Resolved By** | Name / Role |

#### 1. Error Message & Stack Trace
\`\`\`text
[Paste exact error message or terminal/browser console stack trace here]
\`\`\`

#### 2. Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

#### 3. Root Cause Analysis
Explain the exact mechanical reason why the failure occurred.

#### 4. Solution & Code Fix
Describe the fix applied, referencing modified files.

#### 5. Files Affected
- [\`path/to/file.ts\`](file:///d:/Rohit/LoanManagement/path/to/file.ts)

#### 6. Prevention & Regression Guards
Describe how this class of error is prevented going forward.
```

---

## 📖 6. Diagnostic & Troubleshooting Playbook

### Scenario 1: Backend Connection Refused (`ECONNREFUSED`)
- **Symptoms**: `An unexpected server error occurred` or `[vite] http proxy error: ECONNREFUSED 127.0.0.1:9999`.
- **Diagnosis**: The frontend is attempting to call an external functions port (`9999`) that is not listening.
- **Resolution**: Use Vite's integrated `netlifyFunctionsDevPlugin` configured in [`vite.config.ts`](file:///d:/Rohit/LoanManagement/vite.config.ts) to execute handlers directly within Vite.

### Scenario 2: MySQL Access Denied (`ER_ACCESS_DENIED_ERROR`)
- **Symptoms**: `ER_ACCESS_DENIED_ERROR: Access denied for user 'root'@'localhost'`.
- **Diagnosis**: MySQL is running on port 3306, but the password in [`.env`](file:///d:/Rohit/LoanManagement/.env) does not match the local MySQL instance credentials.
- **Resolution**:
  1. Open [`.env`](file:///d:/Rohit/LoanManagement/.env) and set `DB_PASSWORD` to your actual MySQL root password.
  2. Test with `node scripts/db-diagnostic.js`.
  3. Run `npm run db:setup`.

### Scenario 3: MySQL Prepared Statement Undefined Parameters
- **Symptoms**: `Bind parameters must not contain undefined. To pass SQL NULL specify JS null`.
- **Diagnosis**: Optional parameters (e.g. `notes`, `source`) evaluated to `undefined` or camelCase keys were used instead of snake_case.
- **Resolution**: Coalesce all optional fields to `null` (`data.notes ? String(data.notes).trim() : null`) and support both camelCase and snake_case DTO bindings.

### Scenario 4: React Blank Screen Crash (`RangeError: Invalid time value`)
- **Symptoms**: Page renders completely blank; browser console shows `RangeError: Invalid time value` in `date-fns`.
- **Diagnosis**: Database returned snake_case `transaction_date`, while the React component accessed camelCase `transactionDate`, passing `undefined` to `format(new Date(undefined))`.
- **Resolution**:
  1. Transform DB records via `mapDbToCapitalTransaction()` before returning from repositories.
  2. Implement defensive date parsing in UI components with valid Date checks.
  3. Wrap routes in [`ErrorBoundary.tsx`](file:///d:/Rohit/LoanManagement/src/components/common/ErrorBoundary.tsx).
