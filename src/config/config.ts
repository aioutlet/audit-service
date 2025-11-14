import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ override: false });

interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  ssl: boolean;
  poolMin: number;
  poolMax: number;
  url: string;
}

interface LoggingConfig {
  level: string;
  format: string;
  toConsole: boolean;
  toFile: boolean;
  filePath?: string;
}

interface AuditConfig {
  retentionDays: number;
  batchSize: number;
  cleanupIntervalHours: number;
}

interface ServiceConfig {
  name: string;
  version: string;
}

interface DaprConfig {
  host: string;
  httpPort: number;
  grpcPort: number;
  appPort: number;
  secretStoreName: string;
}

interface Config {
  env: string;
  port: number;
  host: string;
  database: DatabaseConfig;
  logging: LoggingConfig;
  audit: AuditConfig;
  service: ServiceConfig;
  dapr: DaprConfig;
}

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value || defaultValue!;
};

const getEnvNumber = (key: string, defaultValue?: number): number => {
  const value = process.env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required`);
  }
  const numValue = Number(value || defaultValue);
  if (isNaN(numValue)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }
  return numValue;
};

const getEnvBoolean = (key: string, defaultValue?: boolean): boolean => {
  const value = process.env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required`);
  }
  const stringValue = (value || defaultValue?.toString())?.toLowerCase();
  return stringValue === 'true' || stringValue === '1';
};

export const config: Config = {
  env: getEnv('NODE_ENV', 'development'),
  port: getEnvNumber('PORT', 9000),
  host: getEnv('HOST', '0.0.0.0'),

  database: {
    host: getEnv('POSTGRES_HOST', 'localhost'),
    port: getEnvNumber('POSTGRES_PORT', 5432),
    name: getEnv('POSTGRES_DB', 'audit_service_db'),
    user: getEnv('POSTGRES_USER', 'postgres'),
    password: getEnv('POSTGRES_PASSWORD', 'password'),
    ssl: getEnvBoolean('DB_SSL', false),
    poolMin: getEnvNumber('DB_POOL_MIN', 5),
    poolMax: getEnvNumber('DB_POOL_MAX', 20),
    url: (() => {
      const databaseUrl = process.env.DATABASE_URL;
      const constructedUrl = `postgresql://${getEnv('POSTGRES_USER', 'postgres')}:${getEnv('POSTGRES_PASSWORD', 'password')}@${getEnv('POSTGRES_HOST', 'localhost')}:${getEnvNumber('POSTGRES_PORT', 5432)}/${getEnv('POSTGRES_DB', 'audit_service_db')}`;
      return databaseUrl || constructedUrl;
    })(),
  },

  logging: {
    level: getEnv('LOG_LEVEL', 'info'),
    format: getEnv('LOG_FORMAT', 'json'),
    toConsole: getEnvBoolean('LOG_TO_CONSOLE', true),
    toFile: getEnvBoolean('LOG_TO_FILE', false),
    filePath: process.env.LOG_FILE_PATH || undefined,
  },

  audit: {
    retentionDays: getEnvNumber('AUDIT_RETENTION_DAYS', 2555), // ~7 years
    batchSize: getEnvNumber('AUDIT_BATCH_SIZE', 1000),
    cleanupIntervalHours: getEnvNumber('AUDIT_CLEANUP_INTERVAL_HOURS', 24),
  },

  service: {
    name: getEnv('NAME', 'audit-service'),
    version: getEnv('VERSION', '1.0.0'),
  },

  dapr: {
    host: getEnv('DAPR_HOST', '127.0.0.1'),
    httpPort: getEnvNumber('DAPR_HTTP_PORT', 3512),
    grpcPort: getEnvNumber('DAPR_GRPC_PORT', 50012),
    appPort: getEnvNumber('PORT', 9000), // Dapr app port same as service port
    secretStoreName: getEnv('DAPR_SECRET_STORE_NAME', 'secret-store'),
  },
};
