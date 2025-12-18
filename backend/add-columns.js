#!/usr/bin/env node

/**
 * Add missing columns to students table
 */

const { Pool } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'csl_user',
  password: 'csl_password',
  database: 'csl_database'
};

async function addColumns() {
  console.log('Adding missing columns to students table...');

  try {
    const pool = new Pool(config);
    const client = await pool.connect();

    // Check current columns
    const columnsResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'students' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    const existingColumns = columnsResult.rows.map(row => row.column_name);
    console.log('Existing columns:', existingColumns.join(', '));

    // Add missing columns
    const columnsToAdd = [
      { name: 'profile_picture', type: 'TEXT' },
      { name: 'institution', type: 'VARCHAR(255)' },
      { name: 'grade', type: 'VARCHAR(20)' }
    ];

    for (const col of columnsToAdd) {
      if (!existingColumns.includes(col.name)) {
        console.log(`Adding column ${col.name}...`);
        await client.query(`ALTER TABLE students ADD COLUMN ${col.name} ${col.type}`);
        console.log(`✅ Added ${col.name}`);
      } else {
        console.log(`⚠️ Column ${col.name} already exists`);
      }
    }

    client.release();
    await pool.end();
    console.log('✅ Columns added successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addColumns();