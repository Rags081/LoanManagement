import { describe, it, expect } from 'vitest';

describe('Loan Status Logic Unit Tests', () => {
  function determineLoanStatus(params: {
    principalOutstanding: number;
    interestOutstanding: number;
    dueDate: string | null;
    currentDate: string;
    isCancelled?: boolean;
  }): 'active' | 'overdue' | 'completed' | 'cancelled' {
    if (params.isCancelled) return 'cancelled';

    const totalOutstanding = params.principalOutstanding + params.interestOutstanding;
    if (totalOutstanding <= 0) return 'completed';

    if (params.dueDate && params.currentDate > params.dueDate && totalOutstanding > 0) {
      return 'overdue';
    }

    return 'active';
  }

  it('should return active for loan with outstanding balance before due date', () => {
    const status = determineLoanStatus({
      principalOutstanding: 10000,
      interestOutstanding: 300,
      dueDate: '2026-10-01',
      currentDate: '2026-09-02',
    });
    expect(status).toBe('active');
  });

  it('should return overdue when due date has passed with outstanding balance', () => {
    const status = determineLoanStatus({
      principalOutstanding: 10000,
      interestOutstanding: 500,
      dueDate: '2026-08-01',
      currentDate: '2026-09-02',
    });
    expect(status).toBe('overdue');
  });

  it('should return completed when total outstanding reaches 0', () => {
    const status = determineLoanStatus({
      principalOutstanding: 0,
      interestOutstanding: 0,
      dueDate: '2026-08-01',
      currentDate: '2026-09-02',
    });
    expect(status).toBe('completed');
  });

  it('should return cancelled when loan is cancelled', () => {
    const status = determineLoanStatus({
      principalOutstanding: 10000,
      interestOutstanding: 0,
      dueDate: null,
      currentDate: '2026-09-02',
      isCancelled: true,
    });
    expect(status).toBe('cancelled');
  });
});
