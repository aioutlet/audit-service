import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  url: string;
}

interface RateLimitConfig {
  enabled: boolean;
  windowMs: number;
  maxRequests: number;
}

interface CorsConfig {
  origin: string;
  credentials: boolean;
}

interface LoggingConfig {
  level: string;
  format: string;
  filePath?: string;
}

interface MetricsConfig {
  enabled: boolean;
  port: number;
}

interface AuditConfig {
  retentionDays: number;
  batchSize: number;
  cleanupIntervalHours: number;
}

interface ServiceConfig {
  name: string;
  version: string;
  correlationIdHeader: string;
}

interface AuthConfig {
  jwtSecret: string;
  serviceSecret: string;
  tokenExpiresIn: string;
}

interface Config {
  env: string;
  port: number;
  host: string;
  database: DatabaseConfig;
  redis: RedisConfig;
  rateLimit: RateLimitConfig;
  cors: CorsConfig;
  logging: LoggingConfig;
  metrics: MetricsConfig;
  audit: AuditConfig;
  service: ServiceConfig;
  auth: AuthConfig;
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
    host: getEnv('DB_HOST', 'localhost'),
    port: getEnvNumber('DB_PORT', 5432),
    name: getEnv('DB_NAME', 'audit_service'),
    user: getEnv('DB_USER', 'postgres'),
    password: getEnv('DB_PASSWORD', 'password'),
    ssl: getEnvBoolean('DB_SSL', false),
    poolMin: getEnvNumber('DB_POOL_MIN', 5),
    poolMax: getEnvNumber('DB_POOL_MAX', 20),
    url: getEnv(
      'DATABASE_URL',
      `postgresql://${getEnv('DB_USER', 'postgres')}:${getEnv('DB_PASSWORD', 'password')}@${getEnv('DB_HOST', 'localhost')}:${getEnvNumber('DB_PORT', 5432)}/${getEnv('DB_NAME', 'audit_service')}`
    ),
  },

  redis: {
    host: getEnv('REDIS_HOST', 'localhost'),
    port: getEnvNumber('REDIS_PORT', 6379),
    password: getEnv('REDIS_PASSWORD', undefined),
    db: getEnvNumber('REDIS_DB', 0),
    url: getEnv('REDIS_URL', `redis://${getEnv('REDIS_HOST', 'localhost')}:${getEnvNumber('REDIS_PORT', 6379)}`),
  },

  rateLimit: {
    enabled: true,
    windowMs: getEnvNumber('API_RATE_LIMIT_WINDOW_MS', 60000),
    maxRequests: getEnvNumber('API_RATE_LIMIT_MAX_REQUESTS', 1000),
  },

  cors: {
    origin: getEnv('CORS_ORIGIN', '*'),
    credentials: getEnvBoolean('CORS_CREDENTIALS', true),
  },

  logging: {
    level: getEnv('LOG_LEVEL', 'info'),
    format: getEnv('LOG_FORMAT', 'json'),
    filePath: getEnv('LOG_FILE_PATH', undefined),
  },

  metrics: {
    enabled: getEnvBoolean('METRICS_ENABLED', true),
    port: getEnvNumber('METRICS_PORT', 9001),
  },

  audit: {
    retentionDays: getEnvNumber('AUDIT_RETENTION_DAYS', 2555), // ~7 years
    batchSize: getEnvNumber('AUDIT_BATCH_SIZE', 1000),
    cleanupIntervalHours: getEnvNumber('AUDIT_CLEANUP_INTERVAL_HOURS', 24),
  },

  service: {
    name: getEnv('SERVICE_NAME', 'audit-service'),
    version: getEnv('SERVICE_VERSION', '1.0.0'),
    correlationIdHeader: getEnv('CORRELATION_ID_HEADER', 'x-correlation-id'),
  },

  auth: {
    jwtSecret: getEnv('JWT_SECRET', 'your-super-secure-jwt-secret-key'),
    serviceSecret: getEnv('SERVICE_SECRET', 'your-super-secure-service-secret-key'),
    tokenExpiresIn: getEnv('JWT_EXPIRES_IN', '24h'),
  },
};
