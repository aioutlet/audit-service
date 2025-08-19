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

console.log('🧹 Starting audit service database cleanup...');

async function dropAllTables() {
  const client = await pool.connect();

  try {
    console.log('🗑️  Dropping all audit service tables...');

    // Drop all tables in the correct order (handle dependencies)
    const tables = [
      'audit_logs',
      'system_events',
      'user_activities',
      'security_events',
      'performance_metrics',
      'audit_logs_archive',
      'audit_configurations',
      'retention_policies',
    ];

    for (const table of tables) {
      try {
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`✅ Dropped table: ${table}`);
      } catch (error) {
        console.log(`ℹ️  Table ${table} did not exist or could not be dropped`);
      }
    }

    // Drop functions
    await client.query('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE');
    await client.query('DROP FUNCTION IF EXISTS archive_old_audit_logs(INTEGER) CASCADE');
    await client.query('DROP FUNCTION IF EXISTS cleanup_audit_data() CASCADE');
    console.log('✅ Dropped functions');

    // Drop views
    await client.query('DROP VIEW IF EXISTS audit_summary_daily CASCADE');
    await client.query('DROP VIEW IF EXISTS security_summary_daily CASCADE');
    console.log('✅ Dropped views');

    console.log('🎉 All audit service schema dropped successfully!');
  } catch (error) {
    console.error('❌ Error dropping schema:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function clearAllData() {
  const client = await pool.connect();

  try {
    console.log('🔗 Connected to audit database');

    // Get counts before clearing
    console.log('\n📊 Current Data Counts:');
    console.log('======================');

    const beforeCounts = await Promise.all([
      client.query('SELECT COUNT(*) FROM audit_logs'),
      client.query('SELECT COUNT(*) FROM system_events'),
      client.query('SELECT COUNT(*) FROM user_activities'),
      client.query('SELECT COUNT(*) FROM security_events'),
      client.query('SELECT COUNT(*) FROM performance_metrics'),
      client.query('SELECT COUNT(*) FROM audit_configurations'),
      client.query('SELECT COUNT(*) FROM retention_policies'),
      client.query('SELECT COUNT(*) FROM audit_logs_archive'),
    ]);

    console.log(`📋 Audit Logs: ${beforeCounts[0].rows[0].count}`);
    console.log(`🖥️  System Events: ${beforeCounts[1].rows[0].count}`);
    console.log(`👥 User Activities: ${beforeCounts[2].rows[0].count}`);
    console.log(`🔐 Security Events: ${beforeCounts[3].rows[0].count}`);
    console.log(`📈 Performance Metrics: ${beforeCounts[4].rows[0].count}`);
    console.log(`⚙️  Audit Configurations: ${beforeCounts[5].rows[0].count}`);
    console.log(`⏰ Retention Policies: ${beforeCounts[6].rows[0].count}`);
    console.log(`🗄️  Audit Logs Archive: ${beforeCounts[7].rows[0].count}`);

    console.log('\n🗑️  Clearing all data...');

    // Clear data tables (preserve configuration tables)
    await client.query('TRUNCATE TABLE audit_logs CASCADE');
    console.log('✅ Cleared audit_logs');

    await client.query('TRUNCATE TABLE system_events CASCADE');
    console.log('✅ Cleared system_events');

    await client.query('TRUNCATE TABLE user_activities CASCADE');
    console.log('✅ Cleared user_activities');

    await client.query('TRUNCATE TABLE security_events CASCADE');
    console.log('✅ Cleared security_events');

    await client.query('TRUNCATE TABLE performance_metrics CASCADE');
    console.log('✅ Cleared performance_metrics');

    await client.query('TRUNCATE TABLE audit_logs_archive CASCADE');
    console.log('✅ Cleared audit_logs_archive');

    // Optionally clear configuration tables (uncomment if needed)
    // await client.query('TRUNCATE TABLE audit_configurations CASCADE');
    // console.log('✅ Cleared audit_configurations');

    // await client.query('TRUNCATE TABLE retention_policies CASCADE');
    // console.log('✅ Cleared retention_policies');

    // Reset sequences to start from 1 again
    console.log('\n🔄 Resetting sequences...');

    // Note: We're using UUIDs so no sequences to reset for primary keys
    // But we can reset any auto-increment columns if they exist

    // Verify cleanup
    console.log('\n✅ Verification - Data Counts After Cleanup:');
    console.log('=============================================');

    const afterCounts = await Promise.all([
      client.query('SELECT COUNT(*) FROM audit_logs'),
      client.query('SELECT COUNT(*) FROM system_events'),
      client.query('SELECT COUNT(*) FROM user_activities'),
      client.query('SELECT COUNT(*) FROM security_events'),
      client.query('SELECT COUNT(*) FROM performance_metrics'),
      client.query('SELECT COUNT(*) FROM audit_configurations'),
      client.query('SELECT COUNT(*) FROM retention_policies'),
      client.query('SELECT COUNT(*) FROM audit_logs_archive'),
    ]);

    console.log(`📋 Audit Logs: ${afterCounts[0].rows[0].count}`);
    console.log(`🖥️  System Events: ${afterCounts[1].rows[0].count}`);
    console.log(`👥 User Activities: ${afterCounts[2].rows[0].count}`);
    console.log(`🔐 Security Events: ${afterCounts[3].rows[0].count}`);
    console.log(`📈 Performance Metrics: ${afterCounts[4].rows[0].count}`);
    console.log(`⚙️  Audit Configurations: ${afterCounts[5].rows[0].count} (preserved)`);
    console.log(`⏰ Retention Policies: ${afterCounts[6].rows[0].count} (preserved)`);
    console.log(`🗄️  Audit Logs Archive: ${afterCounts[7].rows[0].count}`);

    console.log('\n🎉 Audit service database cleared successfully!');
    console.log('💡 Configuration tables were preserved. Run with --full to clear everything.');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

async function clearEverything() {
  const client = await pool.connect();

  try {
    console.log('🔗 Connected to audit database');
    console.log('⚠️  WARNING: This will clear ALL data including configurations!');

    // Clear everything
    const tables = [
      'audit_logs',
      'system_events',
      'user_activities',
      'security_events',
      'performance_metrics',
      'audit_logs_archive',
      'audit_configurations',
      'retention_policies',
    ];

    for (const table of tables) {
      await client.query(`TRUNCATE TABLE ${table} CASCADE`);
      console.log(`✅ Cleared ${table}`);
    }

    console.log('\n🎉 All audit service data cleared successfully!');
  } catch (error) {
    console.error('❌ Error during full cleanup:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const fullCleanup = args.includes('--full') || args.includes('-f');
  const dropSchema = args.includes('--drop-schema') || args.includes('--schema');

  if (dropSchema) {
    console.log('🚨 DROP SCHEMA MODE - This will remove ALL tables and schema!');
    await dropAllTables();
  } else if (fullCleanup) {
    console.log('🚨 FULL CLEANUP MODE - This will remove ALL data including configurations!');
    await clearEverything();
  } else {
    console.log('🧹 STANDARD CLEANUP MODE - Preserving configuration tables');
    await clearAllData();
  }
} // Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { clearAllData, clearEverything, dropAllTables };
