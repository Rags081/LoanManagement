import ExcelJS from 'exceljs';
import { ReportType } from '../../../../src/types/report';

export class ExcelExportService {
  /**
   * Generates a styled ExcelJS workbook buffer for any report
   */
  async generateReportWorkbook(
    reportType: ReportType,
    data: Record<string, unknown>[],
    metadata: { title: string; generatedBy?: string; filters?: Record<string, unknown> }
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'RagsCapital';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(metadata.title.slice(0, 31));

    // 1. Header Banner
    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `RAGSCAPITAL - ${metadata.title.toUpperCase()}`;
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Dark Navy
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 35;

    // 2. Metadata Subheader
    sheet.mergeCells('A2:H2');
    const metaCell = sheet.getCell('A2');
    const dateStr = new Date().toLocaleString();
    metaCell.value = `Generated On: ${dateStr} | Total Records: ${data.length}`;
    metaCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF64748B' } };
    metaCell.alignment = { vertical: 'middle', horizontal: 'left' };
    sheet.getRow(2).height = 20;

    // Empty separator row
    sheet.getRow(3).height = 10;

    // 3. Define Columns based on Report Type
    const columnConfig = this.getColumnDefinitions(reportType);

    const headerRow = sheet.getRow(4);
    headerRow.values = columnConfig.map((c) => c.header);
    headerRow.height = 26;

    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } }; // Slate 700
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      };
    });

    // 4. Populate Data Rows
    let currentRowIdx = 5;
    for (const item of data) {
      const row = sheet.getRow(currentRowIdx);
      const rowValues = columnConfig.map((c) => {
        const val = item[c.key];
        return val !== undefined && val !== null ? val : '-';
      });
      row.values = rowValues;
      row.height = 22;

      // Apply cell formatting
      row.eachCell((cell, colNumber) => {
        const colDef = columnConfig[colNumber - 1];
        cell.font = { name: 'Arial', size: 9.5 };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFF1F5F9' } },
        };

        if (currentRowIdx % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }

        if (colDef?.isCurrency && typeof cell.value === 'number') {
          cell.numFmt = '₹#,##0.00';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else if (colDef?.alignment) {
          cell.alignment = { vertical: 'middle', horizontal: colDef.alignment };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });

      currentRowIdx++;
    }

    // 5. Total Summary Row (if currency columns exist)
    const currencyCols = columnConfig
      .map((c, idx) => ({ ...c, colIdx: idx + 1 }))
      .filter((c) => c.isCurrency);

    if (currencyCols.length > 0 && data.length > 0) {
      const totalRow = sheet.getRow(currentRowIdx);
      totalRow.height = 25;

      const firstCell = totalRow.getCell(1);
      firstCell.value = 'TOTAL';
      firstCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };

      totalRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = { name: 'Arial', size: 10, bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF0F172A' } },
          bottom: { style: 'double', color: { argb: 'FF0F172A' } },
        };
      });

      for (const col of currencyCols) {
        const colLetter = sheet.getColumn(col.colIdx).letter;
        const totalCell = totalRow.getCell(col.colIdx);
        totalCell.value = {
          formula: `SUM(${colLetter}5:${colLetter}${currentRowIdx - 1})`,
          date1904: false,
        };
        totalCell.numFmt = '₹#,##0.00';
        totalCell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
    }

    // 6. Auto-fit column widths
    columnConfig.forEach((col, idx) => {
      const column = sheet.getColumn(idx + 1);
      let maxLen = col.header.length + 4;
      data.forEach((row) => {
        const val = row[col.key];
        if (val) {
          const s = typeof val === 'number' && col.isCurrency ? `₹${val.toLocaleString('en-IN')}` : String(val);
          if (s.length > maxLen) maxLen = s.length;
        }
      });
      column.width = Math.min(Math.max(maxLen + 3, 14), 40);
    });

    const uint8Array = await workbook.xlsx.writeBuffer();
    return Buffer.from(uint8Array);
  }

  /**
   * Generates CSV formatted text for any report with formula injection protection
   */
  generateReportCSV(reportType: ReportType, data: Record<string, unknown>[]): string {
    const columnConfig = this.getColumnDefinitions(reportType);
    const headers = columnConfig.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(',');

    const rows = data.map((item) => {
      return columnConfig
        .map((c) => {
          const val = item[c.key];
          if (val === undefined || val === null) return '""';
          if (typeof val === 'number') {
            return c.isCurrency ? `"${val.toFixed(2)}"` : `"${val}"`;
          }

          let strVal = String(val);
          // Protect against CSV formula injection (=, +, -, @, \t, \r)
          if (/^[=+\-@\t\r]/.test(strVal)) {
            strVal = `'${strVal}`;
          }

          return `"${strVal.replace(/"/g, '""')}"`;
        })
        .join(',');
    });

    return [headers, ...rows].join('\r\n');
  }

  private getColumnDefinitions(
    reportType: ReportType
  ): { header: string; key: string; isCurrency?: boolean; alignment?: 'left' | 'center' | 'right' }[] {
    switch (reportType) {
      case 'capital-statement':
        return [
          { header: 'Trans ID', key: 'transactionId', alignment: 'center' },
          { header: 'Date', key: 'transactionDate', alignment: 'center' },
          { header: 'Type', key: 'transactionType', alignment: 'center' },
          { header: 'Amount (₹)', key: 'amount', isCurrency: true },
          { header: 'Source', key: 'source' },
          { header: 'Destination', key: 'destination' },
          { header: 'Running Balance (₹)', key: 'runningBalance', isCurrency: true },
          { header: 'Reference', key: 'referenceNumber' },
          { header: 'Description', key: 'description' },
        ];

      case 'loan-report':
        return [
          { header: 'Loan ID', key: 'loanId', alignment: 'center' },
          { header: 'Borrower', key: 'borrowerName' },
          { header: 'Phone', key: 'borrowerPhone', alignment: 'center' },
          { header: 'Principal Lent (₹)', key: 'principalAmount', isCurrency: true },
          { header: 'Rate (%)', key: 'interestRate', alignment: 'center' },
          { header: 'Type', key: 'interestRateType', alignment: 'center' },
          { header: 'Disbursal Date', key: 'loanGivenDate', alignment: 'center' },
          { header: 'Status', key: 'status', alignment: 'center' },
          { header: 'Principal Paid (₹)', key: 'principalReceived', isCurrency: true },
          { header: 'Interest Paid (₹)', key: 'interestReceived', isCurrency: true },
          { header: 'Total Paid (₹)', key: 'totalReceived', isCurrency: true },
          { header: 'Principal Due (₹)', key: 'principalOutstanding', isCurrency: true },
          { header: 'Interest Due (₹)', key: 'interestOutstanding', isCurrency: true },
          { header: 'Total Outstanding (₹)', key: 'totalOutstanding', isCurrency: true },
        ];

      case 'borrower-report':
        return [
          { header: 'Borrower ID', key: 'borrowerId', alignment: 'center' },
          { header: 'Full Name', key: 'fullName' },
          { header: 'Phone', key: 'phone', alignment: 'center' },
          { header: 'Email', key: 'email' },
          { header: 'Address', key: 'address' },
          { header: 'Total Loans', key: 'totalLoans', alignment: 'center' },
          { header: 'Active Loans', key: 'activeLoans', alignment: 'center' },
          { header: 'Total Borrowed (₹)', key: 'totalBorrowed', isCurrency: true },
          { header: 'Total Repaid (₹)', key: 'totalRepaid', isCurrency: true },
          { header: 'Principal Due (₹)', key: 'principalOutstanding', isCurrency: true },
          { header: 'Total Outstanding (₹)', key: 'totalOutstanding', isCurrency: true },
        ];

      case 'payment-report':
        return [
          { header: 'Payment ID', key: 'paymentId', alignment: 'center' },
          { header: 'Date', key: 'paymentDate', alignment: 'center' },
          { header: 'Loan ID', key: 'loanId', alignment: 'center' },
          { header: 'Borrower', key: 'borrowerName' },
          { header: 'Payment Amount (₹)', key: 'paymentAmount', isCurrency: true },
          { header: 'Principal Paid (₹)', key: 'principalPortion', isCurrency: true },
          { header: 'Interest Paid (₹)', key: 'interestPortion', isCurrency: true },
          { header: 'Payment Mode', key: 'paymentMode', alignment: 'center' },
          { header: 'Ref / UTR', key: 'referenceNumber' },
          { header: 'Void Status', key: 'isVoid', alignment: 'center' },
        ];

      case 'outstanding-report':
        return [
          { header: 'Loan ID', key: 'loanId', alignment: 'center' },
          { header: 'Borrower', key: 'borrowerName' },
          { header: 'Phone', key: 'borrowerPhone', alignment: 'center' },
          { header: 'Disbursal Date', key: 'loanGivenDate', alignment: 'center' },
          { header: 'Days Active', key: 'daysActive', alignment: 'center' },
          { header: 'Principal Lent (₹)', key: 'principalAmount', isCurrency: true },
          { header: 'Principal Due (₹)', key: 'principalOutstanding', isCurrency: true },
          { header: 'Interest Due (₹)', key: 'interestOutstanding', isCurrency: true },
          { header: 'Total Outstanding (₹)', key: 'totalOutstanding', isCurrency: true },
        ];

      case 'overdue-report':
        return [
          { header: 'Loan ID', key: 'loanId', alignment: 'center' },
          { header: 'Borrower', key: 'borrowerName' },
          { header: 'Phone', key: 'borrowerPhone', alignment: 'center' },
          { header: 'Due Date', key: 'dueDate', alignment: 'center' },
          { header: 'Days Overdue', key: 'daysOverdue', alignment: 'center' },
          { header: 'Principal Lent (₹)', key: 'principalAmount', isCurrency: true },
          { header: 'Total Overdue Balance (₹)', key: 'totalOutstanding', isCurrency: true },
        ];

      case 'interest-report':
        return [
          { header: 'Billing Period', key: 'period', alignment: 'center' },
          { header: 'Expected Interest (₹)', key: 'expectedInterest', isCurrency: true },
          { header: 'Realized Interest (₹)', key: 'realizedInterest', isCurrency: true },
          { header: 'Pending Interest (₹)', key: 'pendingInterest', isCurrency: true },
        ];

      case 'monthly-collection':
        return [
          { header: 'Month', key: 'month' },
          { header: 'Year', key: 'year', alignment: 'center' },
          { header: 'Transactions', key: 'paymentCount', alignment: 'center' },
          { header: 'Principal Recovered (₹)', key: 'principalCollected', isCurrency: true },
          { header: 'Interest Profit (₹)', key: 'interestCollected', isCurrency: true },
          { header: 'Total Collected (₹)', key: 'totalCollected', isCurrency: true },
        ];
    }
  }
}

export const excelExportService = new ExcelExportService();
export default excelExportService;
