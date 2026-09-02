import { getDbDriver } from '../db/config';

// MySQL repositories
import { userRepository as mysqlUserRepo, UserRepository } from './user.repository';
import { borrowerRepository as mysqlBorrowerRepo, BorrowerRepository } from './borrower.repository';
import { loanRepository as mysqlLoanRepo, LoanRepository } from './loan.repository';
import { paymentRepository as mysqlPaymentRepo, PaymentRepository } from './payment.repository';
import { capitalRepository as mysqlCapitalRepo, CapitalRepository } from './capital.repository';
import { dashboardRepository as mysqlDashboardRepo, DashboardRepository } from './dashboard.repository';
import { reportRepository as mysqlReportRepo, ReportRepository } from './report.repository';
import { settingsRepository as mysqlSettingsRepo, SettingsRepository } from './settings.repository';

// MongoDB repositories
import { mongoUserRepository } from './mongo/user.repository.mongo';
import { mongoBorrowerRepository } from './mongo/borrower.repository.mongo';
import { mongoLoanRepository } from './mongo/loan.repository.mongo';
import { mongoPaymentRepository } from './mongo/payment.repository.mongo';
import { mongoCapitalRepository } from './mongo/capital.repository.mongo';
import { mongoDashboardRepository } from './mongo/dashboard.repository.mongo';
import { mongoReportRepository } from './mongo/report.repository.mongo';
import { mongoSettingsRepository } from './mongo/settings.repository.mongo';

export * from './user.repository';
export * from './borrower.repository';
export * from './loan.repository';
export * from './payment.repository';
export * from './capital.repository';
export * from './dashboard.repository';
export * from './report.repository';
export * from './settings.repository';

/**
 * Creates a dynamic repository proxy that routes calls to either MySQL or MongoDB
 * based on the active DB_DRIVER configuration.
 */
function createDriverProxy<T extends object>(mysqlImpl: T, mongoImpl: unknown): T {
  return new Proxy(mysqlImpl, {
    get(target, prop, receiver) {
      const driver = getDbDriver();
      const activeImpl = driver === 'mongodb' ? (mongoImpl as Record<string | symbol, unknown>) : (mysqlImpl as Record<string | symbol, unknown>);
      const value = Reflect.get(activeImpl, prop, receiver);
      if (typeof value === 'function') {
        return value.bind(activeImpl);
      }
      return value;
    },
  });
}

export const userRepository = createDriverProxy<UserRepository>(mysqlUserRepo, mongoUserRepository);
export const borrowerRepository = createDriverProxy<BorrowerRepository>(mysqlBorrowerRepo, mongoBorrowerRepository);
export const loanRepository = createDriverProxy<LoanRepository>(mysqlLoanRepo, mongoLoanRepository);
export const paymentRepository = createDriverProxy<PaymentRepository>(mysqlPaymentRepo, mongoPaymentRepository);
export const capitalRepository = createDriverProxy<CapitalRepository>(mysqlCapitalRepo, mongoCapitalRepository);
export const dashboardRepository = createDriverProxy<DashboardRepository>(mysqlDashboardRepo, mongoDashboardRepository);
export const reportRepository = createDriverProxy<ReportRepository>(mysqlReportRepo, mongoReportRepository);
export const settingsRepository = createDriverProxy<SettingsRepository>(mysqlSettingsRepo, mongoSettingsRepository);

export default {
  userRepository,
  borrowerRepository,
  loanRepository,
  paymentRepository,
  capitalRepository,
  dashboardRepository,
  reportRepository,
  settingsRepository,
};
