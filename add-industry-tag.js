// Add Industry Tag to Existing Responses
// Adds "Disability Support" tag to all responses that don't already have it
// Run with: node add-industry-tag.js

require('dotenv').config();
const path = require('path');

const INDUSTRY_TAGS = ['Disability Support', 'Administrative Assistants (Administration & Office Support)'];

async function addIndustryTag() {
  console.log(`🏷️  Adding industry tags to all existing responses...\n`);
  console.log(`   Tags: ${INDUSTRY_TAGS.join(', ')}\n`);

  // Determine database type based on environment
  const USE_MYSQL = process.env.NODE_ENV === 'production' || process.env.USE_MYSQL === 'true';
  
  let db = null;
  let dbType = 'none';

  // Initialize database connection
  if (USE_MYSQL) {
    // MySQL for production
    try {
      const mysql = require('mysql2/promise');
      db = mysql.createPool({
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      const connection = await db.getConnection();
      console.log('✅ Connected to MySQL database');
      connection.release();
      dbType = 'mysql';
    } catch (e) {
      console.error('❌ MySQL connection failed:', e.message);
      process.exit(1);
    }
  } else {
    // SQLite for development
    try {
      const Database = require('better-sqlite3');
      const dbFile = path.join(__dirname, 'data', 'data.db');
      db = new Database(dbFile);
      console.log('✅ Connected to SQLite database');
      dbType = 'sqlite';
    } catch (e) {
      console.error('❌ SQLite connection failed:', e.message);
      process.exit(1);
    }
  }

  try {
    // Get all responses
    let responses = [];
    if (dbType === 'mysql') {
      const [rows] = await db.execute('SELECT * FROM responses');
      responses = rows;
    } else {
      responses = db.prepare('SELECT * FROM responses').all();
    }

    console.log(`📊 Found ${responses.length} responses\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const response of responses) {
      try {
        // Parse existing tags
        let tags = [];
        if (response.tags) {
          try {
            tags = JSON.parse(response.tags);
          } catch (e) {
            // If tags is not JSON, try splitting by comma
            tags = response.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
          }
        }

        // Add missing industry tags
        let tagsAdded = false;
        INDUSTRY_TAGS.forEach(industryTag => {
          const hasTag = tags.some(tag => 
            tag.toLowerCase() === industryTag.toLowerCase()
          );
          if (!hasTag) {
            tags.push(industryTag);
            tagsAdded = true;
          }
        });

        if (!tagsAdded) {
          skipped++;
          continue;
        }

        const tagsJson = JSON.stringify(tags);

        // Update response
        if (dbType === 'mysql') {
          await db.execute(
            'UPDATE responses SET tags = ? WHERE id = ?',
            [tagsJson, response.id]
          );
        } else {
          db.prepare('UPDATE responses SET tags = ? WHERE id = ?')
            .run(tagsJson, response.id);
        }

        updated++;
        console.log(`✓ Updated response ${response.id.substring(0, 8)}...`);
      } catch (e) {
        errors++;
        console.error(`✗ Error updating response ${response.id}:`, e.message);
      }
    }

    console.log('\n✅ Tag update complete!');
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped (already had tag): ${skipped}`);
    if (errors > 0) {
      console.log(`   Errors: ${errors}`);
    }

  } catch (error) {
    console.error('\n❌ Update failed:', error);
    process.exit(1);
  } finally {
    if (dbType === 'mysql') {
      await db.end();
    } else {
      db.close();
    }
  }
}

// Run the update
addIndustryTag().catch(console.error);
