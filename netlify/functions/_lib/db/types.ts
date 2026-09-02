export type DbDriver = 'mysql' | 'mongodb';

export interface DatabaseConfig {
  driver: DbDriver;
  mysql: {
    host: string;
    port: number;
    user: string;
    password?: string;
    database: string;
    minPool: number;
    maxPool: number;
  };
  mongodb: {
    uri: string;
    database: string;
    maxPoolSize: number;
    minPoolSize: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface HealthStatus {
  status: 'ok' | 'error';
  driver: DbDriver;
  database: 'connected' | 'disconnected' | 'error';
  error?: string;
  uptime: number;
  timestamp: string;
}
