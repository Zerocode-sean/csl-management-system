#!/usr/bin/env node

/**
 * Docker PostgreSQL Setup for CSL Management System
 * Uses actual schema and seed files from the database folder
 */

console.log('🐳 CSL Docker PostgreSQL Setup (Fixed)');
console.log('=====================================\n');

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Docker PostgreSQL configuration
const config = {
  host: 'localhost',
  port: 5432,
  user: 'csl_user',
  password: 'csl_password',
  database: 'csl_database'
};

// File paths (relative to project root)
const projectRoot = path.join(__dirname, '..');
const schemaPath = path.join(projectRoot, 'database', 'schemas', 'complete_schema.sql');
const seedPath = path.join(projectRoot, 'database', 'seeds', 'dev_seed.sql');

async function testConnection() {
  console.log('1️⃣ Testing Docker PostgreSQL Connection');
  console.log('=======================================');
  
  try {
    const pool = new Pool(config);
    const client = await pool.connect();
    const result = await client.query('SELECT version(), current_database(), current_user');
    
    console.log('✅ Connected successfully!');
    console.log(`   Database: ${result.rows[0].current_database}`);
    console.log(`   User: ${result.rows[0].current_user}`);
    console.log(`   Version: ${result.rows[0].version.split(' ')[0]}`);
    
    client.release();
    await pool.end();
    return true;
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check if container is running: docker ps');
    console.log('   2. Check container logs: docker logs csl-postgres');
    console.log('   3. Restart container: docker-compose restart postgres');
    return false;
  }
}

async function createSchema() {
  console.log('\n2️⃣ Creating Database Schema');
  console.log('============================');
  
  try {
    // Check if schema file exists
    if (!fs.existsSync(schemaPath)) {
      console.log(`❌ Schema file not found: ${schemaPath}`);
      return false;
    }
    
    console.log(`   📋 Reading schema from: ${path.relative(projectRoot, schemaPath)}`);
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    const pool = new Pool(config);
    const client = await pool.connect();
    
    // Check if tables already exist
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log(`   ✅ Found ${tableCheck.rows.length} existing tables`);
      tableCheck.rows.forEach(row => {
        console.log(`      - ${row.table_name}`);
      });
    } else {
      console.log('   🔧 Creating database schema...');
      
      // Execute the schema SQL
      await client.query(schemaSQL);
      
      console.log('   ✅ Schema created successfully!');
    }
    
    client.release();
    await pool.end();
    return true;
    
  } catch (error) {
    console.log('❌ Schema creation failed:', error.message);
    // Print more detailed error information
    if (error.position) {
      console.log(`   Error at position: ${error.position}`);
    }
    return false;
  }
}

async function seedData() {
  console.log('\n3️⃣ Loading Sample Data');
  console.log('=======================');
  
  try {
    // Check if seed file exists
    if (!fs.existsSync(seedPath)) {
      console.log(`❌ Seed file not found: ${seedPath}`);
      return false;
    }
    
    console.log(`   📋 Reading seed data from: ${path.relative(projectRoot, seedPath)}`);
    const seedSQL = fs.readFileSync(seedPath, 'utf8');
    
    const pool = new Pool(config);
    const client = await pool.connect();
    
    // Check if data already exists
    const studentCount = await client.query('SELECT COUNT(*) FROM students');
    
    if (parseInt(studentCount.rows[0].count) > 0) {
      console.log(`   ✅ Data already exists (${studentCount.rows[0].count} students)`);
    } else {
      console.log('   🌱 Loading sample data...');
      
      // Execute the seed SQL
      await client.query(seedSQL);
      
      console.log('   ✅ Sample data loaded successfully!');
    }
    
    client.release();
    await pool.end();
    return true;
    
  } catch (error) {
    console.log('❌ Data seeding failed:', error.message);
    return false;
  }
}

async function verifySetup() {
  console.log('\n4️⃣ Verifying Database Setup');
  console.log('============================');
  
  try {
    const pool = new Pool(config);
    const client = await pool.connect();
    
    // Check tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`   📊 Tables (${tables.rows.length}):`);
    tables.rows.forEach(row => {
      console.log(`      ✓ ${row.table_name}`);
    });
    
    // Check data counts
    const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM students) as students,
        (SELECT COUNT(*) FROM courses) as courses,
        (SELECT COUNT(*) FROM admins) as admins,
        (SELECT COUNT(*) FROM certificates) as certificates
    `);
    
    console.log('\n   📈 Data counts:');
    console.log(`      Students: ${counts.rows[0].students}`);
    console.log(`      Courses: ${counts.rows[0].courses}`);
    console.log(`      Admins: ${counts.rows[0].admins}`);
    console.log(`      Certificates: ${counts.rows[0].certificates}`);
    
    client.release();
    await pool.end();
    return true;
    
  } catch (error) {
    console.log('❌ Verification failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('Setting up PostgreSQL database in Docker...\n');
  
  // Test connection
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }
  
  // Create schema
  const schemaCreated = await createSchema();
  if (!schemaCreated) {
    process.exit(1);
  }
  
  // Seed data
  const dataSeeded = await seedData();
  if (!dataSeeded) {
    process.exit(1);
  }
  
  // Verify setup
  const verified = await verifySetup();
  if (!verified) {
    process.exit(1);
  }
  
  console.log('\n🎉 Docker PostgreSQL Setup Complete!');
  console.log('=====================================');
  console.log('✅ Database is ready for the CSL Management System');
  console.log('✅ You can now start the backend server');
  console.log('\n💡 Next steps:');
  console.log('   1. Start backend: node database-production-server.js');
  console.log('   2. Test API endpoints');
  console.log('   3. Run integration tests\n');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.log('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the setup
main().catch(error => {
  console.log('❌ Setup failed:', error.message);
  process.exit(1);
});
