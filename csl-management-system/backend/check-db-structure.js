#!/usr/bin/env node

/**
 * Check Database Table Structure
 */

console.log('🔍 Checking Database Structure...\n');

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'csl_user',
  password: process.env.DB_PASSWORD || 'csl_password',
  database: process.env.DB_NAME || 'csl_database'
});

async function checkStructure() {
  try {
    const client = await pool.connect();
    
    // Check students table columns
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'students' 
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Students table columns:');
    columns.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type}`);
    });
    
    // Get sample data
    const sample = await client.query('SELECT * FROM students LIMIT 2');
    console.log('\n📋 Sample data:');
    console.log(sample.rows);
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkStructure();
