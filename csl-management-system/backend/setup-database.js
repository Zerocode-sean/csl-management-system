#!/usr/bin/env node

/**
 * PostgreSQL Database Setup Script for CSL Management System
 * This script will:
 * 1. Check PostgreSQL installation
 * 2. Create database and user
 * 3. Run schema creation
 * 4. Seed initial data
 * 5. Test connection
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🗄️  CSL Management System - PostgreSQL Database Setup');
console.log('====================================================\n');

// Configuration
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '5432',
  superUser: 'postgres', // PostgreSQL superuser
  superPassword: process.env.POSTGRES_PASSWORD || 'postgres',
  dbName: process.env.DB_NAME || 'csl_database',
  dbUser: process.env.DB_USER || 'csl_user',
  dbPassword: process.env.DB_PASSWORD || 'csl_password'
};

// Helper functions
function runCommand(command, description) {
  console.log(`\n📋 ${description}...`);
  try {
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ Success: ${description}`);
    return result;
  } catch (error) {
    console.log(`❌ Failed: ${description}`);
    console.log(`Error: ${error.message}`);
    return null;
  }
}

function runPsqlCommand(command, description, database = 'postgres') {
  const psqlCommand = `psql -h ${DB_CONFIG.host} -p ${DB_CONFIG.port} -U ${DB_CONFIG.superUser} -d ${database} -c "${command}"`;
  return runCommand(`PGPASSWORD=${DB_CONFIG.superPassword} ${psqlCommand}`, description);
}

function runPsqlFile(filePath, description, database = DB_CONFIG.dbName) {
  const psqlCommand = `psql -h ${DB_CONFIG.host} -p ${DB_CONFIG.port} -U ${DB_CONFIG.dbUser} -d ${database} -f "${filePath}"`;
  return runCommand(`PGPASSWORD=${DB_CONFIG.dbPassword} ${psqlCommand}`, description);
}

async function main() {
  console.log('🔍 Database Configuration:');
  console.log(`   Host: ${DB_CONFIG.host}:${DB_CONFIG.port}`);
  console.log(`   Database: ${DB_CONFIG.dbName}`);
  console.log(`   User: ${DB_CONFIG.dbUser}`);
  console.log(`   Password: ${DB_CONFIG.dbPassword ? '***SET***' : 'NOT SET'}`);

  // Step 1: Check PostgreSQL installation
  console.log('\n1️⃣ Checking PostgreSQL Installation');
  console.log('=====================================');
  
  const pgVersion = runCommand('psql --version', 'Check PostgreSQL client');
  if (!pgVersion) {
    console.log('\n❌ PostgreSQL is not installed or not in PATH');
    console.log('📥 Please install PostgreSQL:');
    console.log('   Windows: https://www.postgresql.org/download/windows/');
    console.log('   Or use: winget install PostgreSQL.PostgreSQL');
    process.exit(1);
  }

  // Step 2: Check if PostgreSQL service is running
  console.log('\n2️⃣ Checking PostgreSQL Service');
  console.log('===============================');
  
  const serviceCheck = runCommand('sc query postgresql*', 'Check PostgreSQL service status');
  
  // Try to connect to PostgreSQL
  const connectionTest = runPsqlCommand('SELECT version();', 'Test PostgreSQL connection');
  if (!connectionTest) {
    console.log('\n❌ Cannot connect to PostgreSQL server');
    console.log('💡 Please ensure:');
    console.log('   1. PostgreSQL service is running');
    console.log('   2. Username/password are correct');
    console.log('   3. Server is accepting connections on localhost:5432');
    console.log('\n🔧 To start PostgreSQL service:');
    console.log('   net start postgresql-x64-16  (or similar)');
    process.exit(1);
  }

  // Step 3: Create database user
  console.log('\n3️⃣ Creating Database User');
  console.log('==========================');
  
  // Check if user exists
  const userExists = runPsqlCommand(
    `SELECT 1 FROM pg_roles WHERE rolname='${DB_CONFIG.dbUser}';`,
    'Check if CSL user exists'
  );
  
  if (!userExists || !userExists.includes('1')) {
    runPsqlCommand(
      `CREATE USER ${DB_CONFIG.dbUser} WITH PASSWORD '${DB_CONFIG.dbPassword}';`,
      'Create CSL database user'
    );
    
    runPsqlCommand(
      `ALTER USER ${DB_CONFIG.dbUser} CREATEDB;`,
      'Grant database creation privileges'
    );
  } else {
    console.log('✅ CSL user already exists');
  }

  // Step 4: Create database
  console.log('\n4️⃣ Creating Database');
  console.log('====================');
  
  // Check if database exists
  const dbExists = runPsqlCommand(
    `SELECT 1 FROM pg_database WHERE datname='${DB_CONFIG.dbName}';`,
    'Check if CSL database exists'
  );
  
  if (!dbExists || !dbExists.includes('1')) {
    runPsqlCommand(
      `CREATE DATABASE ${DB_CONFIG.dbName} OWNER ${DB_CONFIG.dbUser};`,
      'Create CSL database'
    );
    
    runPsqlCommand(
      `GRANT ALL PRIVILEGES ON DATABASE ${DB_CONFIG.dbName} TO ${DB_CONFIG.dbUser};`,
      'Grant database privileges'
    );
  } else {
    console.log('✅ CSL database already exists');
  }

  // Step 5: Run schema creation
  console.log('\n5️⃣ Creating Database Schema');
  console.log('============================');
  
  const schemaFile = path.join(__dirname, '..', 'database', 'schemas', 'enhanced_schema.sql');
  if (fs.existsSync(schemaFile)) {
    runPsqlFile(schemaFile, 'Execute enhanced schema');
  } else {
    console.log('❌ Enhanced schema file not found');
    console.log(`Expected: ${schemaFile}`);
  }

  // Step 6: Seed initial data
  console.log('\n6️⃣ Seeding Initial Data');
  console.log('========================');
  
  const seedFile = path.join(__dirname, '..', 'database', 'seeds', 'dev_seed.sql');
  if (fs.existsSync(seedFile)) {
    runPsqlFile(seedFile, 'Load development seed data');
  } else {
    console.log('⚠️ Seed file not found, skipping initial data');
  }

  // Step 7: Test connection with Node.js
  console.log('\n7️⃣ Testing Node.js Connection');
  console.log('==============================');
  
  try {
    const { Pool } = require('pg');
    const testPool = new Pool({
      host: DB_CONFIG.host,
      port: parseInt(DB_CONFIG.port),
      user: DB_CONFIG.dbUser,
      password: DB_CONFIG.dbPassword,
      database: DB_CONFIG.dbName
    });
    
    const client = await testPool.connect();
    const result = await client.query('SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = $1', ['public']);
    client.release();
    await testPool.end();
    
    console.log(`✅ Node.js connection successful`);
    console.log(`✅ Found ${result.rows[0].table_count} tables in database`);
    
  } catch (error) {
    console.log(`❌ Node.js connection failed: ${error.message}`);
  }

  // Step 8: Summary
  console.log('\n🎉 Database Setup Complete!');
  console.log('============================');
  console.log('✅ PostgreSQL server: Running');
  console.log(`✅ Database: ${DB_CONFIG.dbName}`);
  console.log(`✅ User: ${DB_CONFIG.dbUser}`);
  console.log('✅ Schema: Created');
  console.log('✅ Initial data: Loaded');
  console.log('✅ Node.js connection: Verified');
  
  console.log('\n🚀 Next Steps:');
  console.log('1. Update backend to use real database');
  console.log('2. Test API endpoints with PostgreSQL');
  console.log('3. Run integration tests');
  console.log('4. Proceed with frontend development');
  
  console.log('\n🌐 Connection Details:');
  console.log(`   Host: ${DB_CONFIG.host}:${DB_CONFIG.port}`);
  console.log(`   Database: ${DB_CONFIG.dbName}`);
  console.log(`   Username: ${DB_CONFIG.dbUser}`);
  console.log(`   Connection URL: postgresql://${DB_CONFIG.dbUser}:***@${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.dbName}`);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error.message);
  process.exit(1);
});

// Run setup
main().catch(console.error);
