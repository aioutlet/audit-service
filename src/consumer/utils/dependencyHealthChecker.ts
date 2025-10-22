import { Pool } from 'pg';

/**
 * Create PostgreSQL connection configuration from environment variables
 */
function createPostgresConfig() {
  return {
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    ssl: process.env.DB_SSL?.toLowerCase() === 'true',
    max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    min: parseInt(process.env.DB_POOL_MIN || '5', 10),
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  };
}

/**
 * Check PostgreSQL database health using connection pool
 */
export async function checkDatabaseHealth(): Promise<{ service: string; status: string; error?: string }> {
  let pool: Pool | null = null;
  try {
    const config = createPostgresConfig();
    console.log(`[DB] Checking database health at ${config.host}:${config.port}`);
    console.log(`[DB] Using database: ${config.database}`);

    // Create a connection pool for health checking
    pool = new Pool({
      ...config,
      max: 1, // Only one connection for health check
    });

    // Test the connection with a simple query
    const result = await pool.query('SELECT NOW() as current_time, version() as version');
    console.log(`[DB] ✅ Database connection is healthy - PostgreSQL version: ${result.rows[0].version.split(' ')[1]}`);

    return { service: 'database', status: 'healthy' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[DB] ❌ Database health check failed: ${errorMessage}`);
    return { service: 'database', status: 'unhealthy', error: errorMessage };
  } finally {
    // Always close the health check pool
    if (pool) {
      try {
        await pool.end();
      } catch (closeError) {
        console.error(`[DB] Warning: Failed to close health check pool: ${closeError}`);
      }
    }
  }
}

/**
 * Check message broker health based on configured type
 */
export async function checkMessageBrokerHealth(): Promise<{ service: string; status: string; error?: string }> {
  const brokerType = process.env.MESSAGE_BROKER_TYPE?.toLowerCase();

  try {
    console.log(`[BROKER] Checking ${brokerType} message broker health...`);

    if (brokerType === 'rabbitmq') {
      const brokerUrl = process.env.MESSAGE_BROKER_URL;
      if (!brokerUrl) {
        throw new Error('MESSAGE_BROKER_URL not configured');
      }

      // For RabbitMQ, we can check if the connection URL is accessible
      // This is a basic check - the actual broker connection is handled by the messaging layer
      const url = new URL(brokerUrl);
      console.log(`[BROKER] RabbitMQ configured at ${url.hostname}:${url.port}`);

      // Note: Real connection health is checked when the message broker connects
      // This is just a configuration validation
      return { service: 'message-broker', status: 'configured' };
    } else if (brokerType === 'kafka') {
      const brokers = process.env.KAFKA_BROKERS;
      if (!brokers) {
        throw new Error('KAFKA_BROKERS not configured');
      }

      console.log(`[BROKER] Kafka configured with brokers: ${brokers}`);
      return { service: 'message-broker', status: 'configured' };
    } else if (brokerType === 'azure-service-bus') {
      const connectionString = process.env.AZURE_SERVICE_BUS_CONNECTION_STRING;
      if (!connectionString) {
        throw new Error('AZURE_SERVICE_BUS_CONNECTION_STRING not configured');
      }

      console.log(`[BROKER] Azure Service Bus configured`);
      return { service: 'message-broker', status: 'configured' };
    } else {
      throw new Error(`Unsupported message broker type: ${brokerType}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[BROKER] ❌ Message broker health check failed: ${errorMessage}`);
    return { service: 'message-broker', status: 'unhealthy', error: errorMessage };
  }
}

/**
 * Check health of service dependencies
 */
export async function checkDependencyHealth(): Promise<Array<{ service: string; status: string; error?: string }>> {
  console.log('[DEPS] 🔍 Checking dependency health...');

  const healthChecks = [checkDatabaseHealth(), checkMessageBrokerHealth()];

  try {
    const results = await Promise.allSettled(healthChecks);
    const healthResults = results.map((result) =>
      result.status === 'fulfilled' ? result.value : { service: 'unknown', status: 'error', error: 'Promise rejected' }
    );

    // Summary logging
    const healthyServices = healthResults.filter((r) => r.status === 'healthy' || r.status === 'configured').length;
    const totalServices = healthResults.length;

    if (healthyServices === totalServices) {
      console.log(`[DEPS] 🎉 All ${totalServices} dependencies are healthy/configured`);
    } else {
      console.error(`[DEPS] ⚠️ ${healthyServices}/${totalServices} dependencies are healthy/configured`);
    }

    return healthResults;
  } catch (error) {
    console.error(`[DEPS] ❌ Dependency health check failed: ${error}`);
    return [
      { service: 'dependency-check', status: 'error', error: error instanceof Error ? error.message : 'Unknown error' },
    ];
  }
}

/**
 * Get configured dependencies for audit-service consumer
 */
export function getDependencies(): string[] {
  const dependencies: string[] = [];

  // Database is always a dependency
  dependencies.push('PostgreSQL Database');

  // Message broker dependency
  const brokerType = process.env.MESSAGE_BROKER_TYPE?.toLowerCase();
  if (brokerType) {
    dependencies.push(`Message Broker (${brokerType.toUpperCase()})`);
  }

  return dependencies;
}
