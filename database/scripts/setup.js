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

console.log('🔧 Audit Service Database Setup');

async function checkDatabaseExists() {
  // Connect to postgres database to check if our database exists
  const adminPool = new Pool({
    user: process.env.DB_USER || 'audit_user',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres',
    password: process.env.DB_PASSWORD || 'audit_password',
    port: process.env.DB_PORT || 5432,
  });

  try {
    const client = await adminPool.connect();
    const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      process.env.DB_NAME || 'audit_db',
    ]);
    client.release();
    await adminPool.end();

    return result.rows.length > 0;
  } catch (error) {
    console.error('❌ Error checking database existence:', error.message);
    await adminPool.end();
    return false;
  }
}

async function createSchema() {
  console.log('🏗️  Creating database schema...');

  try {
    const schemaPath = path.join(__dirname, '../schemas/audit_schema.sql');
    const schemaSQL = await fs.readFile(schemaPath, 'utf8');

    const client = await pool.connect();
    await client.query(schemaSQL);
    client.release();

    console.log('✅ Database schema created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating schema:', error.message);
    return false;
  }
}

async function seedDatabase() {
  console.log('🌱 Seeding database with initial data...');

  try {
    // Import and run the seed script
    const seedScript = require('./seed');
    await seedScript.main();
    return true;
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    return false;
  }
}

async function verifySetup() {
  console.log('🔍 Verifying database setup...');

  try {
    const client = await pool.connect();

    // Check if main tables exist
    const tables = [
      'audit_logs',
      'system_events',
      'user_activities',
      'security_events',
      'performance_metrics',
      'audit_configurations',
      'retention_policies',
    ];

    for (const table of tables) {
      const result = await client.query(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`, [
        table,
      ]);

      if (!result.rows[0].exists) {
        console.log(`❌ Table ${table} does not exist`);
        client.release();
        return false;
      }
    }

    // Get record counts
    const counts = await Promise.all(tables.map((table) => client.query(`SELECT COUNT(*) FROM ${table}`)));

    console.log('\n📊 Database Verification:');
    console.log('========================');
    tables.forEach((table, index) => {
      console.log(`✅ ${table}: ${counts[index].rows[0].count} records`);
    });

    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error verifying setup:', error.message);
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 Starting audit service database setup...\n');

    // Check if database exists
    const dbExists = await checkDatabaseExists();
    if (!dbExists) {
      console.log('⚠️  Database does not exist. Please create the database first:');
      console.log(
        `   createdb -h ${process.env.DB_HOST || 'localhost'} -U postgres ${process.env.DB_NAME || 'audit_db'}`
      );
      process.exit(1);
    }

    console.log('✅ Database exists, proceeding with setup...\n');

    // Test connection
    const client = await pool.connect();
    console.log('✅ Successfully connected to audit database');
    client.release();

    // Create schema
    const schemaCreated = await createSchema();
    if (!schemaCreated) {
      console.log('❌ Failed to create schema');
      process.exit(1);
    }

    // Seed data (this will also create schema if it doesn't exist)
    const seeded = await seedDatabase();
    if (!seeded) {
      console.log('❌ Failed to seed database');
      process.exit(1);
    }

    // Verify setup
    const verified = await verifySetup();
    if (!verified) {
      console.log('❌ Database setup verification failed');
      process.exit(1);
    }

    console.log('\n🎉 Audit service database setup completed successfully!');
    console.log('📍 You can now start the audit service');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, createSchema, verifySetup };
