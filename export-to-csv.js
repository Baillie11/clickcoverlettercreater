// Export SQLite Data to CSV Files
// Creates CSV files that can be imported into MySQL via phpMyAdmin
// Run with: node export-to-csv.js

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Escape quotes and wrap in quotes if contains comma, newline, or quote
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function arrayToCSV(headers, rows, includeHeaders = false) {
  const dataRows = rows.map(row => 
    headers.map(header => escapeCSV(row[header])).join(',')
  );
  if (includeHeaders) {
    const headerRow = headers.join(',');
    return [headerRow, ...dataRows].join('\n');
  }
  return dataRows.join('\n');
}

async function exportToCSV() {
  console.log('📤 Exporting SQLite data to CSV files...\n');

  // Connect to SQLite
  const dbFile = path.join(__dirname, 'data', 'data.db');
  if (!fs.existsSync(dbFile)) {
    console.error('❌ Database file not found:', dbFile);
    process.exit(1);
  }

  const db = new Database(dbFile);
  console.log('✅ Connected to local SQLite database\n');

  // Create exports directory
  const exportDir = path.join(__dirname, 'exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir);
  }

  try {
    // Export Users
    console.log('👥 Exporting users...');
    const users = db.prepare('SELECT * FROM users').all();
    if (users.length > 0) {
      const userHeaders = ['id', 'username', 'passwordHash', 'shareResponses', 'createdAt'];
      const userCSV = arrayToCSV(userHeaders, users);
      fs.writeFileSync(path.join(exportDir, 'users.csv'), userCSV);
      console.log(`   ✅ Exported ${users.length} users to exports/users.csv`);
    } else {
      console.log('   ℹ️  No users to export');
    }

    // Export Responses
    console.log('\n💬 Exporting responses...');
    const responses = db.prepare('SELECT * FROM responses').all();
    if (responses.length > 0) {
      const responseHeaders = ['id', 'text', 'category', 'userCreated', 'source', 'tags', 'userId', 'createdAt'];
      const responseCSV = arrayToCSV(responseHeaders, responses);
      fs.writeFileSync(path.join(exportDir, 'responses.csv'), responseCSV);
      console.log(`   ✅ Exported ${responses.length} responses to exports/responses.csv`);
    } else {
      console.log('   ℹ️  No responses to export');
    }

    // Export Applications
    console.log('\n📋 Exporting applications...');
    try {
      const applications = db.prepare('SELECT * FROM applications').all();
      if (applications.length > 0) {
        const appHeaders = ['id', 'userId', 'company', 'role', 'status', 'notes', 'date', 'paragraphs', 'timeSpent', 'createdAt', 'updatedAt'];
        const appCSV = arrayToCSV(appHeaders, applications);
        fs.writeFileSync(path.join(exportDir, 'applications.csv'), appCSV);
        console.log(`   ✅ Exported ${applications.length} applications to exports/applications.csv`);
      } else {
        console.log('   ℹ️  No applications to export');
      }
    } catch (e) {
      console.log('   ℹ️  Applications table does not exist (skipping)');
    }

    console.log('\n✅ Export complete!\n');
    console.log('📁 CSV files created in: ' + exportDir);
    console.log('\n📝 Next steps:');
    console.log('   1. Go to phpMyAdmin on VentraIP');
    console.log('   2. Select your database: clickeco_clickcover');
    console.log('   3. For each table (users, responses, applications):');
    console.log('      - Click on the table name');
    console.log('      - Click "Import" tab');
    console.log('      - Choose the corresponding CSV file');
    console.log('      - Format: CSV');
    console.log('      - Click "Go"');
    console.log('\n⚠️  Note: If tables already have data, you may need to:');
    console.log('   - Delete existing rows first, OR');
    console.log('   - Handle duplicate key errors during import');

  } catch (error) {
    console.error('\n❌ Export failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Run export
exportToCSV().catch(console.error);
