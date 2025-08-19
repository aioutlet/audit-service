const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'audit_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'audit_db',
  password: process.env.DB_PASSWORD || 'audit_password',
  port: process.env.DB_PORT || 5432,
});

console.log('🌱 Starting audit service database seeding...');

async function createSchema() {
  console.log('🏗️  Creating database schema...');

  const schemaPath = path.join(__dirname, '../schemas/audit_schema.sql');
  const schemaSQL = await fs.readFile(schemaPath, 'utf8');

  const client = await pool.connect();
  try {
    await client.query(schemaSQL);
    console.log('✅ Database schema created successfully');
  } catch (error) {
    console.error('❌ Error creating schema:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function loadSeedData() {
  const dataDir = path.join(__dirname, '../data');

  // Load all seed files
  const auditConfigs = JSON.parse(await fs.readFile(path.join(dataDir, 'audit_configurations.json'), 'utf8'));

  const sampleLogs = JSON.parse(await fs.readFile(path.join(dataDir, 'sample_audit_logs.json'), 'utf8'));

  const systemEvents = JSON.parse(await fs.readFile(path.join(dataDir, 'system_events.json'), 'utf8'));

  const securityEvents = JSON.parse(await fs.readFile(path.join(dataDir, 'security_events.json'), 'utf8'));

  return {
    auditConfigs,
    sampleLogs,
    systemEvents,
    securityEvents,
  };
}

async function seedAuditConfigurations(auditConfigs) {
  console.log('📋 Seeding audit configurations...');

  for (const config of auditConfigs) {
    try {
      await pool.query(
        `
                INSERT INTO audit_configurations (
                    service_name, event_type, enabled, log_level, retention_days,
                    include_request_body, include_response_body, include_headers,
                    sampling_rate, filters
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (service_name, event_type) 
                DO UPDATE SET
                    enabled = EXCLUDED.enabled,
                    log_level = EXCLUDED.log_level,
                    retention_days = EXCLUDED.retention_days,
                    include_request_body = EXCLUDED.include_request_body,
                    include_response_body = EXCLUDED.include_response_body,
                    include_headers = EXCLUDED.include_headers,
                    sampling_rate = EXCLUDED.sampling_rate,
                    filters = EXCLUDED.filters,
                    updated_at = NOW()
            `,
        [
          config.service_name,
          config.event_type,
          config.enabled,
          config.log_level,
          config.retention_days,
          config.include_request_body,
          config.include_response_body,
          config.include_headers,
          config.sampling_rate,
          JSON.stringify(config.filters),
        ]
      );

      console.log(`✅ Seeded config: ${config.service_name} - ${config.event_type}`);
    } catch (error) {
      console.error(`❌ Error seeding config ${config.service_name} - ${config.event_type}:`, error.message);
    }
  }
}

async function seedAuditLogs(sampleLogs) {
  console.log('📊 Seeding sample audit logs...');

  for (const log of sampleLogs) {
    try {
      await pool.query(
        `
                INSERT INTO audit_logs (
                    event_id, service_name, action, resource_type, resource_id,
                    user_id, session_id, ip_address, user_agent, request_method,
                    request_url, request_headers, response_status, event_data,
                    severity, timestamp
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                ON CONFLICT (event_id) DO NOTHING
            `,
        [
          log.event_id,
          log.service_name,
          log.action,
          log.resource_type,
          log.resource_id,
          log.user_id,
          log.session_id,
          log.ip_address,
          log.user_agent,
          log.request_method,
          log.request_url,
          JSON.stringify(log.request_headers),
          log.response_status,
          JSON.stringify(log.event_data),
          log.severity,
          log.timestamp,
        ]
      );

      console.log(`✅ Seeded audit log: ${log.event_id}`);
    } catch (error) {
      console.error(`❌ Error seeding audit log ${log.event_id}:`, error.message);
    }
  }
}

async function seedSystemEvents(systemEvents) {
  console.log('🖥️  Seeding system events...');

  for (const event of systemEvents) {
    try {
      await pool.query(
        `
                INSERT INTO system_events (
                    event_type, component, event_name, description, severity,
                    metadata, host_name, process_id, memory_usage, cpu_usage,
                    disk_usage, timestamp
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `,
        [
          event.event_type,
          event.component,
          event.event_name,
          event.description,
          event.severity,
          JSON.stringify(event.metadata),
          event.host_name,
          event.process_id,
          event.memory_usage,
          event.cpu_usage,
          event.disk_usage,
          event.timestamp,
        ]
      );

      console.log(`✅ Seeded system event: ${event.component} - ${event.event_name}`);
    } catch (error) {
      console.error(`❌ Error seeding system event:`, error.message);
    }
  }
}

async function seedSecurityEvents(securityEvents) {
  console.log('🔐 Seeding security events...');

  for (const event of securityEvents) {
    try {
      await pool.query(
        `
                INSERT INTO security_events (
                    event_type, threat_level, source_ip, target_resource, user_id,
                    session_id, attack_vector, description, blocked, rule_triggered,
                    event_data, timestamp
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `,
        [
          event.event_type,
          event.threat_level,
          event.source_ip,
          event.target_resource,
          event.user_id,
          event.session_id,
          event.attack_vector,
          event.description,
          event.blocked,
          event.rule_triggered,
          JSON.stringify(event.event_data),
          event.timestamp,
        ]
      );

      console.log(`✅ Seeded security event: ${event.event_type} - ${event.threat_level}`);
    } catch (error) {
      console.error(`❌ Error seeding security event:`, error.message);
    }
  }
}

async function seedRetentionPolicies() {
  console.log('⏰ Seeding default retention policies...');

  const policies = [
    { table_name: 'audit_logs', retention_days: 365, archive_enabled: true },
    { table_name: 'system_events', retention_days: 90, archive_enabled: false },
    { table_name: 'user_activities', retention_days: 180, archive_enabled: false },
    { table_name: 'security_events', retention_days: 730, archive_enabled: true },
    { table_name: 'performance_metrics', retention_days: 30, archive_enabled: false },
  ];

  for (const policy of policies) {
    try {
      await pool.query(
        `
                INSERT INTO retention_policies (table_name, retention_days, archive_enabled)
                VALUES ($1, $2, $3)
                ON CONFLICT (table_name) DO UPDATE SET
                    retention_days = EXCLUDED.retention_days,
                    archive_enabled = EXCLUDED.archive_enabled,
                    updated_at = NOW()
            `,
        [policy.table_name, policy.retention_days, policy.archive_enabled]
      );

      console.log(`✅ Seeded retention policy: ${policy.table_name}`);
    } catch (error) {
      console.error(`❌ Error seeding retention policy:`, error.message);
    }
  }
}

async function seedPerformanceMetrics() {
  console.log('📈 Seeding sample performance metrics...');

  const services = ['auth-service', 'user-service', 'product-service', 'order-service'];
  const endpoints = ['/health', '/api/status', '/api/metrics'];
  const methods = ['GET', 'POST', 'PUT'];

  for (let i = 0; i < 20; i++) {
    const service = services[Math.floor(Math.random() * services.length)];
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const method = methods[Math.floor(Math.random() * methods.length)];

    const timestamp = new Date();
    timestamp.setMinutes(timestamp.getMinutes() - Math.floor(Math.random() * 1440)); // Random time in last 24 hours

    try {
      await pool.query(
        `
                INSERT INTO performance_metrics (
                    service_name, endpoint, method, response_time_ms, status_code,
                    throughput_rps, error_rate, memory_usage, cpu_usage,
                    active_connections, cache_hit_rate, timestamp
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `,
        [
          service,
          endpoint,
          method,
          Math.floor(Math.random() * 1000) + 50, // 50-1050ms response time
          Math.random() > 0.1 ? 200 : 500, // 90% success rate
          Math.random() * 100 + 10, // 10-110 RPS
          Math.random() * 0.05, // 0-5% error rate
          Math.floor(Math.random() * 100000000) + 50000000, // 50-150MB memory
          Math.random() * 80 + 5, // 5-85% CPU
          Math.floor(Math.random() * 1000) + 10, // 10-1010 connections
          Math.random() * 0.4 + 0.6, // 60-100% cache hit rate
          timestamp,
        ]
      );
    } catch (error) {
      console.error(`❌ Error seeding performance metric:`, error.message);
    }
  }

  console.log('✅ Seeded 20 sample performance metrics');
}

async function main() {
  const client = await pool.connect();

  try {
    console.log('🔗 Connected to audit database');

    // Create schema first
    await createSchema();

    // Load seed data
    const seedData = await loadSeedData();

    // Seed all data
    await seedRetentionPolicies();
    await seedAuditConfigurations(seedData.auditConfigs);
    await seedAuditLogs(seedData.sampleLogs);
    await seedSystemEvents(seedData.systemEvents);
    await seedSecurityEvents(seedData.securityEvents);
    await seedPerformanceMetrics(); // Get counts for verification
    const counts = await Promise.all([
      client.query('SELECT COUNT(*) FROM audit_configurations'),
      client.query('SELECT COUNT(*) FROM audit_logs'),
      client.query('SELECT COUNT(*) FROM system_events'),
      client.query('SELECT COUNT(*) FROM security_events'),
      client.query('SELECT COUNT(*) FROM performance_metrics'),
      client.query('SELECT COUNT(*) FROM retention_policies'),
    ]);

    console.log('\n📊 Seeding Summary:');
    console.log('==================');
    console.log(`✅ Audit Configurations: ${counts[0].rows[0].count}`);
    console.log(`✅ Audit Logs: ${counts[1].rows[0].count}`);
    console.log(`✅ System Events: ${counts[2].rows[0].count}`);
    console.log(`✅ Security Events: ${counts[3].rows[0].count}`);
    console.log(`✅ Performance Metrics: ${counts[4].rows[0].count}`);
    console.log(`✅ Retention Policies: ${counts[5].rows[0].count}`);
    console.log('==================');
    console.log('🎉 Audit service database seeded successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
