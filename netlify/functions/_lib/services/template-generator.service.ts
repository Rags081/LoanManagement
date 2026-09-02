import ExcelJS from 'exceljs';
import { ImportType, ImportTemplateInfo } from '../../../../src/types/report';

export class TemplateGeneratorService {
  getTemplateInfo(type: ImportType): ImportTemplateInfo {
    switch (type) {
      case 'borrowers':
        return {
          type: 'borrowers',
          title: 'Borrowers Import Template',
          description: 'Template for bulk importing borrower profiles and contact details.',
          filename: 'borrowers_import_template.xlsx',
          columns: ['fullName', 'phone', 'email', 'address', 'notes', 'status'],
          sampleRow: {
            fullName: 'Ramesh Sharma',
            phone: '+91 9876543210',
            email: 'ramesh@example.com',
            address: '123 Market Road, New Delhi',
            notes: 'Verified local business owner',
            status: 'active',
          },
        };

      case 'loans':
        return {
          type: 'loans',
          title: 'Loans Import Template',
          description: 'Template for migrating existing active/historical loan contracts.',
          filename: 'loans_import_template.xlsx',
          columns: ['borrowerPhone', 'principalAmount', 'interestRate', 'interestRateType', 'loanGivenDate', 'dueDate', 'notes'],
          sampleRow: {
            borrowerPhone: '+91 9876543210',
            principalAmount: 50000,
            interestRate: 3,
            interestRateType: 'monthly',
            loanGivenDate: '2026-01-10',
            dueDate: '2026-07-10',
            notes: 'Shop inventory expansion loan',
          },
        };

      case 'payments':
        return {
          type: 'payments',
          title: 'Payments Import Template',
          description: 'Template for recording historical repayments and collections.',
          filename: 'payments_import_template.xlsx',
          columns: ['loanCustomId', 'paymentDate', 'paymentAmount', 'paymentMode', 'referenceNumber', 'allocationMethod', 'notes'],
          sampleRow: {
            loanCustomId: 'LN-001',
            paymentDate: '2026-02-10',
            paymentAmount: 10000,
            paymentMode: 'upi',
            referenceNumber: 'UPI-987654321',
            allocationMethod: 'interest_first',
            notes: 'First installment via GPay',
          },
        };

      case 'capital':
        return {
          type: 'capital',
          title: 'Capital Inflow/Outflow Template',
          description: 'Template for bulk recording capital pool injections and withdrawals.',
          filename: 'capital_import_template.xlsx',
          columns: ['transactionDate', 'transactionType', 'amount', 'source', 'destination', 'referenceNumber', 'description'],
          sampleRow: {
            transactionDate: '2026-01-01',
            transactionType: 'capital_given',
            amount: 500000,
            source: 'Primary Partner Fund',
            destination: 'Main Lending Pool',
            referenceNumber: 'BANK-TRF-001',
            description: 'Initial lending capital investment',
          },
        };
    }
  }

  async generateTemplateWorkbook(type: ImportType): Promise<Buffer> {
    const info = this.getTemplateInfo(type);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Loan Management System';

    const sheet = workbook.addWorksheet('Data Import');

    // Title Banner
    sheet.mergeCells('A1:G1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = info.title.toUpperCase();
    titleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 30;

    // Instructions
    sheet.mergeCells('A2:G2');
    const noteCell = sheet.getCell('A2');
    noteCell.value = `INSTRUCTIONS: Fill in the data starting from row 4. Do not alter column headers. ${info.description}`;
    noteCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF475569' } };
    sheet.getRow(2).height = 20;

    // Column Headers
    const headerRow = sheet.getRow(3);
    headerRow.values = info.columns;
    headerRow.height = 24;

    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }; // Indigo 600
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Sample Row
    const sampleRow = sheet.getRow(4);
    sampleRow.values = info.columns.map((c) => info.sampleRow[c]);
    sampleRow.height = 20;
    sampleRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 9.5, color: { argb: 'FF334155' } };
    });

    // Column auto-width
    info.columns.forEach((col, idx) => {
      sheet.getColumn(idx + 1).width = Math.max(col.length + 6, 18);
    });

    const uint8Array = await workbook.xlsx.writeBuffer();
    return Buffer.from(uint8Array);
  }
}

export const templateGeneratorService = new TemplateGeneratorService();
export default templateGeneratorService;
