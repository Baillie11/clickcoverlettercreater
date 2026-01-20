// Data Migration Script: SQLite → MySQL
// Migrates all users, responses, and applications from local SQLite to production MySQL
// Run with: node migrate-data.js

require('dotenv').config();
const path = require('path');

async function migrate() {
  console.log('🔄 Starting data migration from SQLite to MySQL...\n');

  // Load SQLite (source)
  const Database = require('better-sqlite3');
  const dbFile = path.join(__dirname, 'data', 'data.db');
  const sqliteDb = new Database(dbFile);
  console.log('✅ Connected to local SQLite database');

  // Load MySQL (destination)
  const mysql = require('mysql2/promise');
  const mysqlPool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  
  try {
    const connection = await mysqlPool.getConnection();
    console.log('✅ Connected to MySQL database\n');
    connection.release();
  } catch (e) {
    console.error('❌ MySQL connection failed:', e.message);
    console.error('Make sure MySQL credentials in .env are correct');
    process.exit(1);
  }

  try {
    // Get counts from SQLite
    const userCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const responseCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM responses').get().count;
    const appCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM applications').get().count || 0;

    console.log('📊 Local SQLite Data:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Responses: ${responseCount}`);
    console.log(`   Applications: ${appCount}\n`);

    if (userCount === 0 && responseCount === 0 && appCount === 0) {
      console.log('ℹ️  No data to migrate. Exiting.');
      process.exit(0);
    }

    // Migrate Users
    console.log('👥 Migrating users...');
    const users = sqliteDb.prepare('SELECT * FROM users').all();
    let usersInserted = 0;
    let usersSkipped = 0;

    for (const user of users) {
      try {
        await mysqlPool.execute(
          'INSERT INTO users (id, username, passwordHash, shareResponses, createdAt) VALUES (?, ?, ?, ?, ?)',
          [user.id, user.username, user.passwordHash, user.shareResponses || 1, user.createdAt]
        );
        usersInserted++;
      } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') {
          usersSkipped++;
        } else {
          console.error(`   ⚠️  Error inserting user ${user.username}:`, e.message);
        }
      }
    }
    console.log(`   ✅ Inserted: ${usersInserted}, Skipped (already exists): ${usersSkipped}\n`);

    // Migrate Responses
    console.log('💬 Migrating responses...');
    const responses = sqliteDb.prepare('SELECT * FROM responses').all();
    let responsesInserted = 0;
    let responsesSkipped = 0;

    for (const response of responses) {
      try {
        await mysqlPool.execute(
          'INSERT INTO responses (id, text, category, userCreated, source, tags, userId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            response.id,
            response.text,
            response.category,
            response.userCreated,
            response.source,
            response.tags,
            response.userId,
            response.createdAt
          ]
        );
        responsesInserted++;
      } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') {
          responsesSkipped++;
        } else {
          console.error(`   ⚠️  Error inserting response ${response.id}:`, e.message);
        }
      }
    }
    console.log(`   ✅ Inserted: ${responsesInserted}, Skipped (already exists): ${responsesSkipped}\n`);

    // Migrate Applications (if table exists)
    if (appCount > 0) {
      console.log('📋 Migrating applications...');
      const applications = sqliteDb.prepare('SELECT * FROM applications').all();
      let appsInserted = 0;
      let appsSkipped = 0;

      for (const app of applications) {
        try {
          await mysqlPool.execute(
            'INSERT INTO applications (id, userId, company, role, status, notes, date, paragraphs, timeSpent, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              app.id,
              app.userId,
              app.company,
              app.role,
              app.status,
              app.notes,
              app.date,
              app.paragraphs,
              app.timeSpent || 0,
              app.createdAt,
              app.updatedAt
            ]
          );
          appsInserted++;
        } catch (e) {
          if (e.code === 'ER_DUP_ENTRY') {
            appsSkipped++;
          } else {
            console.error(`   ⚠️  Error inserting application ${app.id}:`, e.message);
          }
        }
      }
      console.log(`   ✅ Inserted: ${appsInserted}, Skipped (already exists): ${appsSkipped}\n`);
    }

    // Verify migration
    console.log('✅ Migration complete!\n');
    console.log('📊 MySQL Database now has:');
    const [mysqlUsers] = await mysqlPool.execute('SELECT COUNT(*) as count FROM users');
    const [mysqlResponses] = await mysqlPool.execute('SELECT COUNT(*) as count FROM responses');
    const [mysqlApps] = await mysqlPool.execute('SELECT COUNT(*) as count FROM applications');
    
    console.log(`   Users: ${mysqlUsers[0].count}`);
    console.log(`   Responses: ${mysqlResponses[0].count}`);
    console.log(`   Applications: ${mysqlApps[0].count}\n`);

    console.log('🎉 Data migration successful!');
    console.log('\n📝 Next steps:');
    console.log('   1. Update .env: Set NODE_ENV=production');
    console.log('   2. Upload all files to VentraIP');
    console.log('   3. Run NPM Install on VentraIP');
    console.log('   4. Start the application');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    sqliteDb.close();
    await mysqlPool.end();
  }
}

// Run migration
migrate().catch(console.error);
