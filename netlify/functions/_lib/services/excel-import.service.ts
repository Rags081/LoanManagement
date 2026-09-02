import ExcelJS from 'exceljs';
import { RowDataPacket } from 'mysql2/promise';
import { getPool } from '../database';
import { borrowerRepository } from '../repositories/borrower.repository';
import { loanRepository } from '../repositories/loan.repository';
import { paymentRepository } from '../repositories/payment.repository';
import { capitalRepository } from '../repositories/capital.repository';
import { ImportType, ImportResult, ImportRowError } from '../../../../src/types/report';

export class ExcelImportService {
  /**
   * Main import handler
   */
  async importData(
    type: ImportType,
    fileBuffer: Buffer,
    userId: number = 1
  ): Promise<ImportResult> {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(fileBuffer);
    } catch {
      return {
        success: false,
        totalRows: 0,
        importedCount: 0,
        errorCount: 1,
        errors: [{ row: 0, field: 'file', message: 'Invalid or corrupt Excel (.xlsx) file format' }],
        message: 'Failed to parse Excel file',
      };
    }

    const sheet = workbook.worksheets[0];
    if (!sheet || sheet.rowCount < 2) {
      return {
        success: false,
        totalRows: 0,
        importedCount: 0,
        errorCount: 1,
        errors: [{ row: 0, field: 'sheet', message: 'Excel worksheet is empty or missing data rows' }],
        message: 'Worksheet is empty',
      };
    }

    // Extract headers and data rows
    // Detect header row (row 3 or row 1)
    let headerRowIdx = 1;
    let headers: string[] = [];

    for (let r = 1; r <= Math.min(5, sheet.rowCount); r++) {
      const rowVals = sheet.getRow(r).values as (string | number | undefined)[];
      const strVals = rowVals.filter(Boolean).map((v) => String(v).trim());
      if (
        strVals.includes('fullName') ||
        strVals.includes('borrowerPhone') ||
        strVals.includes('loanCustomId') ||
        strVals.includes('transactionType') ||
        strVals.includes('Full Name') ||
        strVals.includes('Phone')
      ) {
        headerRowIdx = r;
        headers = (rowVals.slice(1) as string[]).map((h) => String(h || '').trim());
        break;
      }
    }

    if (headers.length === 0) {
      // Fallback: take row 1
      headers = ((sheet.getRow(1).values as string[]).slice(1) || []).map((h) => String(h || '').trim());
      headerRowIdx = 1;
    }

    const parsedRows: { rowNum: number; data: Record<string, unknown> }[] = [];

    for (let r = headerRowIdx + 1; r <= sheet.rowCount; r++) {
      const row = sheet.getRow(r);
      const rowVals = (row.values as (string | number | undefined)[]).slice(1);

      // Check if completely empty row
      const hasContent = rowVals.some((v) => v !== undefined && v !== null && String(v).trim() !== '');
      if (!hasContent) continue;

      const rowObj: Record<string, unknown> = {};
      headers.forEach((header, idx) => {
        if (header) {
          let val = rowVals[idx];
          if (val && typeof val === 'object' && 'text' in val) {
            val = (val as { text: string }).text;
          }
          if (val && typeof val === 'object' && 'result' in val) {
            val = (val as { result: unknown }).result as string | number;
          }
          rowObj[header] = val;
        }
      });

      parsedRows.push({ rowNum: r, data: rowObj });
    }

    if (parsedRows.length === 0) {
      return {
        success: false,
        totalRows: 0,
        importedCount: 0,
        errorCount: 1,
        errors: [{ row: 0, field: 'rows', message: 'No valid data rows found in Excel sheet' }],
        message: 'No data rows found',
      };
    }

    // Process import according to type
    switch (type) {
      case 'borrowers':
        return this.importBorrowers(parsedRows, userId);
      case 'loans':
        return this.importLoans(parsedRows, userId);
      case 'payments':
        return this.importPayments(parsedRows, userId);
      case 'capital':
        return this.importCapital(parsedRows, userId);
    }
  }

  /**
   * 1. Import Borrowers
   */
  private async importBorrowers(
    rows: { rowNum: number; data: Record<string, unknown> }[],
    userId: number
  ): Promise<ImportResult> {
    const errors: ImportRowError[] = [];
    const validBorrowers: {
      fullName: string;
      phone: string;
      email?: string;
      address?: string;
      notes?: string;
      status?: 'active' | 'inactive' | 'blacklisted';
    }[] = [];

    const phoneSet = new Set<string>();

    for (const r of rows) {
      const name = String(r.data.fullName || r.data['Full Name'] || '').trim();
      const phone = String(r.data.phone || r.data.Phone || '').trim();

      if (!name) {
        errors.push({ row: r.rowNum, field: 'fullName', message: 'Full Name is required' });
        continue;
      }
      if (!phone || phone.length < 10) {
        errors.push({ row: r.rowNum, field: 'phone', message: 'Valid 10+ digit Phone number is required' });
        continue;
      }
      if (phoneSet.has(phone)) {
        errors.push({ row: r.rowNum, field: 'phone', message: `Duplicate phone ${phone} found in this Excel sheet` });
        continue;
      }
      phoneSet.add(phone);

      const email = r.data.email ? String(r.data.email).trim() : undefined;
      const address = r.data.address ? String(r.data.address).trim() : undefined;
      const notes = r.data.notes ? String(r.data.notes).trim() : undefined;
      const statusRaw = String(r.data.status || 'active').trim().toLowerCase();
      const status = (['active', 'inactive', 'blacklisted'].includes(statusRaw) ? statusRaw : 'active') as
        | 'active'
        | 'inactive'
        | 'blacklisted';

      validBorrowers.push({
        fullName: name,
        phone,
        email,
        address,
        notes,
        status,
      });
    }

    if (errors.length > 0) {
      return {
        success: false,
        totalRows: rows.length,
        importedCount: 0,
        errorCount: errors.length,
        errors,
        message: `Validation failed with ${errors.length} error(s). No records were imported.`,
      };
    }

    // Execute atomic MySQL transaction
    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      let count = 0;
      for (const b of validBorrowers) {
        // Check if phone already exists in DB
        const [existing] = await conn.query<RowDataPacket[]>(
          'SELECT id FROM borrowers WHERE phone = ? AND deleted_at IS NULL LIMIT 1',
          [b.phone]
        );
        if (existing.length > 0) {
          throw new Error(`Borrower with phone ${b.phone} already exists in database`);
        }

        await borrowerRepository.create(b, userId, conn);
        count++;
      }

      await conn.commit();

      return {
        success: true,
        totalRows: rows.length,
        importedCount: count,
        errorCount: 0,
        errors: [],
        message: `Successfully imported ${count} borrower(s)!`,
      };
    } catch (err: unknown) {
      await conn.rollback();
      const msg = (err as Error).message || 'Database error during borrower import';
      return {
        success: false,
        totalRows: rows.length,
        importedCount: 0,
        errorCount: 1,
        errors: [{ row: 0, field: 'transaction', message: msg }],
        message: `Import failed & rolled back: ${msg}`,
      };
    } finally {
      conn.release();
    }
  }

  /**
   * 2. Import Loans
   */
  private async importLoans(
    rows: { rowNum: number; data: Record<string, unknown> }[],
    userId: number
  ): Promise<ImportResult> {
    const errors: ImportRowError[] = [];
    const validLoans: {
      borrowerPhone: string;
      principalAmount: number;
      interestRate: number;
      interestRateType: 'monthly' | 'daily' | 'flat';
      loanGivenDate: string;
      dueDate?: string;
      notes?: string;
    }[] = [];

    for (const r of rows) {
      const phone = String(r.data.borrowerPhone || r.data.Phone || '').trim();
      const amount = Number(r.data.principalAmount || r.data.Amount || 0);
      const rate = Number(r.data.interestRate || r.data.Rate || 0);
      const rateTypeRaw = String(r.data.interestRateType || 'monthly').trim().toLowerCase();
      const rateType = (rateTypeRaw === 'daily' || rateTypeRaw === 'flat' ? rateTypeRaw : 'monthly') as 'monthly' | 'daily' | 'flat';
      const loanDate = String(r.data.loanGivenDate || r.data.Date || '').trim().split('T')[0];
      const dueDate = r.data.dueDate ? String(r.data.dueDate).trim().split('T')[0] : undefined;
      const notes = r.data.notes ? String(r.data.notes).trim() : undefined;

      if (!phone) {
        errors.push({ row: r.rowNum, field: 'borrowerPhone', message: 'Borrower phone is required' });
        continue;
      }
      if (isNaN(amount) || amount <= 0) {
        errors.push({ row: r.rowNum, field: 'principalAmount', message: 'Principal amount must be greater than 0' });
        continue;
      }
      if (isNaN(rate) || rate <= 0) {
        errors.push({ row: r.rowNum, field: 'interestRate', message: 'Interest rate must be greater than 0' });
        continue;
      }
      if (!loanDate || isNaN(Date.parse(loanDate))) {
        errors.push({ row: r.rowNum, field: 'loanGivenDate', message: 'Valid loan given date (YYYY-MM-DD) is required' });
        continue;
      }

      validLoans.push({
        borrowerPhone: phone,
        principalAmount: amount,
        interestRate: rate,
        interestRateType: rateType,
        loanGivenDate: loanDate,
        dueDate,
        notes,
      });
    }

    if (errors.length > 0) {
      return {
        success: false,
        totalRows: rows.length,
        importedCount: 0,
        errorCount: errors.length,
        errors,
        message: `Validation failed with ${errors.length} error(s). No records were imported.`,
      };
    }

    // Execute atomic MySQL transaction
    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      let count = 0;
      for (const l of validLoans) {
        // Find borrower by phone
        const [borrowers] = await conn.query<RowDataPacket[]>(
          'SELECT id FROM borrowers WHERE phone = ? AND deleted_at IS NULL LIMIT 1',
          [l.borrowerPhone]
        );
        if (borrowers.length === 0) {
          throw new Error(`Borrower with phone ${l.borrowerPhone} does not exist in the database`);
        }

        const borrowerId = borrowers[0].id;
        await loanRepository.create(
          {
            borrowerId,
            principalAmount: l.principalAmount,
            interestRate: l.interestRate,
            interestRateType: l.interestRateType,
            loanGivenDate: l.loanGivenDate,
            dueDate: l.dueDate,
            notes: l.notes,
          },
          userId,
          conn
        );
        count++;
      }

      await conn.commit();

      return {
        success: true,
        totalRows: rows.length,
        importedCount: count,
        errorCount: 0,
        errors: [],
        message: `Successfully imported ${count} loan(s)!`,
      };
    } catch (err: unknown) {
      await conn.rollback();
      const msg = (err as Error).message || 'Database error during loan import';
      return {
        success: false,
        totalRows: rows.length,
        importedCount: 0,
        errorCount: 1,
        errors: [{ row: 0, field: 'transaction', message: msg }],
        message: `Import failed & rolled back: ${msg}`,
      };
    } finally {
      conn.release();
    }
  }

  /**
   * 3. Import Payments
   */
  private async importPayments(
    rows: { rowNum: number; data: Record<string, unknown> }[],
    userId: number
  ): Promise<ImportResult> {
    const errors: ImportRowError[] = [];
    const validPayments: {
      loanCustomId: string;
      paymentDate: string;
      paymentAmount: number;
      paymentMode: 'cash' | 'upi' | 'bank_transfer' | 'other';
      referenceNumber?: string;
      allocationMethod?: 'principal_first' | 'interest_first' | 'proportional';
      notes?: string;
    }[] = [];

    for (const r of rows) {
      const loanId = String(r.data.loanCustomId || r.data['Loan ID'] || '').trim();
      const amount = Number(r.data.paymentAmount || r.data.Amount || 0);
      const payDate = String(r.data.paymentDate || r.data.Date || '').trim().split('T')[0];
      const modeRaw = String(r.data.paymentMode || 'cash').trim().toLowerCase();
      const mode = (['cash', 'upi', 'bank_transfer', 'other'].includes(modeRaw) ? modeRaw : 'cash') as
        | 'cash'
        | 'upi'
        | 'bank_transfer'
        | 'other';
      const ref = r.data.referenceNumber ? String(r.data.referenceNumber).trim() : undefined;
      const allocRaw = String(r.data.allocationMethod || 'interest_first').trim().toLowerCase();
      const alloc = (['principal_first', 'interest_first', 'proportional'].includes(allocRaw) ? allocRaw : 'interest_first') as
        | 'principal_first'
        | 'interest_first'
        | 'proportional';
      const notes = r.data.notes ? String(r.data.notes).trim() : undefined;

      if (!loanId) {
        errors.push({ row: r.rowNum, field: 'loanCustomId', message: 'Loan ID (e.g. LN-001) is required' });
        continue;
      }
      if (isNaN(amount) || amount <= 0) {
        errors.push({ row: r.rowNum, field: 'paymentAmount', message: 'Payment amount must be greater than 0' });
        continue;
      }
      if (!payDate || isNaN(Date.parse(payDate))) {
        errors.push({ row: r.rowNum, field: 'paymentDate', message: 'Valid payment date (YYYY-MM-DD) is required' });
        continue;
      }

      validPayments.push({
        loanCustomId: loanId,
        paymentDate: payDate,
        paymentAmount: amount,
        paymentMode: mode,
        referenceNumber: ref,
        allocationMethod: alloc,
        notes,
      });
    }

    if (errors.length > 0) {
      return {
        success: false,
        totalRows: rows.length,
        importedCount: 0,
        errorCount: errors.length,
        errors,
        message: `Validation failed with ${errors.length} error(s). No records were imported.`,
      };
    }

    // Execute atomic MySQL transaction
    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      let count = 0;
      for (const p of validPayments) {
        const [loans] = await conn.query<RowDataPacket[]>(
          'SELECT id FROM loans WHERE (loan_id = ? OR id = ?) AND deleted_at IS NULL LIMIT 1',
          [p.loanCustomId, isNaN(Number(p.loanCustomId)) ? -1 : Number(p.loanCustomId)]
        );
        if (loans.length === 0) {
          throw new Error(`Loan ${p.loanCustomId} does not exist in database`);
        }

        const loanDbId = loans[0].id;
        await paymentRepository.create(
          {
            loanId: loanDbId,
            paymentDate: p.paymentDate,
            paymentAmount: p.paymentAmount,
            paymentMode: p.paymentMode,
            referenceNumber: p.referenceNumber,
            allocationMethod: p.allocationMethod || 'interest_first',
            notes: p.notes,
          },
          userId,
          conn
        );
        count++;
      }

      await conn.commit();

      return {
        success: true,
        totalRows: rows.length,
        importedCount: count,
        errorCount: 0,
        errors: [],
        message: `Successfully imported ${count} payment(s)!`,
      };
    } catch (err: unknown) {
      await conn.rollback();
      const msg = (err as Error).message || 'Database error during payment import';
      return {
        success: false,
        totalRows: rows.length,
        importedCount: 0,
        errorCount: 1,
        errors: [{ row: 0, field: 'transaction', message: msg }],
        message: `Import failed & rolled back: ${msg}`,
      };
    } finally {
      conn.release();
    }
  }

  /**
   * 4. Import Capital Transactions
   */
  private async importCapital(
    rows: { rowNum: number; data: Record<string, unknown> }[],
    userId: number
  ): Promise<ImportResult> {
    const errors: ImportRowError[] = [];
    const validCapital: {
      transactionDate: string;
      transactionType: 'capital_given' | 'capital_returned' | 'adjustment';
      amount: number;
      source?: string;
      destination?: string;
      referenceNumber?: string;
      description?: string;
    }[] = [];

    for (const r of rows) {
      const typeRaw = String(r.data.transactionType || 'capital_given').trim().toLowerCase();
      const type = (['capital_given', 'capital_returned', 'adjustment'].includes(typeRaw) ? typeRaw : 'capital_given') as
        | 'capital_given'
        | 'capital_returned'
        | 'adjustment';
      const amount = Number(r.data.amount || r.data.Amount || 0);
      const date = String(r.data.transactionDate || r.data.Date || '').trim().split('T')[0];
      const source = r.data.source ? String(r.data.source).trim() : undefined;
      const destination = r.data.destination ? String(r.data.destination).trim() : undefined;
      const ref = r.data.referenceNumber ? String(r.data.referenceNumber).trim() : undefined;
      const desc = r.data.description ? String(r.data.description).trim() : undefined;

      if (isNaN(amount) || amount <= 0) {
        errors.push({ row: r.rowNum, field: 'amount', message: 'Amount must be greater than 0' });
        continue;
      }
      if (!date || isNaN(Date.parse(date))) {
        errors.push({ row: r.rowNum, field: 'transactionDate', message: 'Valid transaction date (YYYY-MM-DD) is required' });
        continue;
      }

      validCapital.push({
        transactionDate: date,
        transactionType: type,
        amount,
        source,
        destination,
        referenceNumber: ref,
        description: desc,
      });
    }

    if (errors.length > 0) {
      return {
        success: false,
        totalRows: rows.length,
        importedCount: 0,
        errorCount: errors.length,
        errors,
        message: `Validation failed with ${errors.length} error(s). No records were imported.`,
      };
    }

    // Execute atomic MySQL transaction
    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      let count = 0;
      for (const c of validCapital) {
        await capitalRepository.create(
          {
            transactionDate: c.transactionDate,
            transactionType: c.transactionType,
            amount: c.amount,
            source: c.source,
            destination: c.destination,
            referenceNumber: c.referenceNumber,
            description: c.description,
          },
          userId,
          conn
        );
        count++;
      }

      await conn.commit();

      return {
        success: true,
        totalRows: rows.length,
        importedCount: count,
        errorCount: 0,
        errors: [],
        message: `Successfully imported ${count} capital transaction(s)!`,
      };
    } catch (err: unknown) {
      await conn.rollback();
      const msg = (err as Error).message || 'Database error during capital import';
      return {
        success: false,
        totalRows: rows.length,
        importedCount: 0,
        errorCount: 1,
        errors: [{ row: 0, field: 'transaction', message: msg }],
        message: `Import failed & rolled back: ${msg}`,
      };
    } finally {
      conn.release();
    }
  }
}

export const excelImportService = new ExcelImportService();
export default excelImportService;
