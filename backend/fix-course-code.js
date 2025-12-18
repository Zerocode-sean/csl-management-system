const { Client } = require('pg');
require('dotenv').config();

async function checkAndFixCourseCodeColumn() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check current column definition
    const schemaQuery = `
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'courses' AND column_name = 'code'
    `;
    
    const schemaResult = await client.query(schemaQuery);
    console.log('Current schema:', JSON.stringify(schemaResult.rows, null, 2));

    // Check if we need to alter
    if (schemaResult.rows.length > 0) {
      const currentLength = schemaResult.rows[0].character_maximum_length;
      
      if (currentLength === null || currentLength < 10) {
        console.log(`\nAltering column from CHAR(${currentLength || 2}) to VARCHAR(10)...`);
        
        await client.query(`
          ALTER TABLE courses 
          ALTER COLUMN code TYPE VARCHAR(10)
        `);
        
        console.log('✅ Column altered successfully!');
        
        // Verify the change
        const verifyResult = await client.query(schemaQuery);
        console.log('\nNew schema:', JSON.stringify(verifyResult.rows, null, 2));
      } else {
        console.log('✅ Column is already the correct size');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

checkAndFixCourseCodeColumn();
