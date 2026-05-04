const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not set');
  console.error('\nUsage:');
  console.error('DATABASE_URL="postgresql://user:password@host:5432/db" node setup-supabase.js');
  process.exit(1);
}

function convertMySQLtoPostgreSQL(sql) {
  let converted = sql;

  // Remove MySQL-specific pragmas and comments
  converted = converted.replace(/\/\*![0-9]+.*?\*\//g, '');
  converted = converted.replace(/^--.*?(?:Host|Database|Server version).*$/gm, '');
  converted = converted.replace(/^-- .*/gm, (match) => {
    if (match.includes('Table structure') || match.includes('Dump completed')) {
      return match;
    }
    return '';
  });

  // Remove MySQL variable assignments
  converted = converted.replace(/SET @[^=]+=@@[^;]+;/gi, '');

  // Convert backticks to quotes
  converted = converted.replace(/`([^`]+)`/g, '"$1"');

  // Convert ENUM to VARCHAR
  converted = converted.replace(/enum\('([^']+(?:','[^']+)*?)'\)/gi, 'VARCHAR(100)');

  // Convert tinyint(1) to BOOLEAN
  converted = converted.replace(/tinyint\(1\)/gi, 'BOOLEAN');

  // Convert datetime to TIMESTAMP
  converted = converted.replace(/\bdatetime\b/gi, 'TIMESTAMP');

  // Convert int(11) AUTO_INCREMENT to SERIAL
  converted = converted.replace(/int\(11\)\s+NOT NULL\s+AUTO_INCREMENT/gi, 'SERIAL');

  // Convert remaining int(11) to INTEGER
  converted = converted.replace(/int\(11\)/gi, 'INTEGER');

  // Remove ENGINE, CHARSET, and COLLATE clauses
  converted = converted.replace(/\s+ENGINE=[^\s;]+/gi, '');
  converted = converted.replace(/\s+DEFAULT CHARSET=[^\s;]+/gi, '');
  converted = converted.replace(/\s+COLLATE=[^\s;]+/gi, '');

  // Remove DEFAULT NULL
  converted = converted.replace(/\s+DEFAULT NULL/gi, '');

  // Fix PRIMARY KEY syntax
  converted = converted.replace(/PRIMARY\s+INDEX/gi, 'PRIMARY KEY');

  // Fix UNIQUE KEY syntax
  converted = converted.replace(/UNIQUE\s+KEY\s+"[^"]+"\s*\(([^)]+)\)/gi, 'UNIQUE ($1)');
  
  // Remove normal KEY definitions since Postgres doesn't support them in CREATE TABLE
  converted = converted.replace(/,\s*KEY\s+"[^"]+"\s*\([^)]+\)/gi, '');

  // Remove duplicate semicolons and clean up
  converted = converted.replace(/;[\s;]*;/g, ';');
  converted = converted.replace(/\n\s*\n/g, '\n');

  return converted.trim();
}

async function setupSupabase() {
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is required');
    process.exit(1);
  }

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Required for Supabase
  });

  try {
    console.log('🔄 Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected to Supabase\n');

    const sqlDir = path.join(__dirname, 'database', 'MySQL Recycling Pickup');
    const sqlFiles = fs.readdirSync(sqlDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`📋 Found ${sqlFiles.length} SQL files\n`);

    // Execute files in dependency order (tables with no FK first)
    const executionOrder = [
      'recycling_pickup_scheduler_account.sql',
      'recycling_pickup_scheduler_address.sql',
      'recycling_pickup_scheduler_pickup_time_slot.sql',
      'recycling_pickup_scheduler_waste_category.sql',
      'recycling_pickup_scheduler_pickup_request.sql',
      'recycling_pickup_scheduler_request_item.sql',
      'recycling_pickup_scheduler_request_image.sql',
      'recycling_pickup_scheduler_notification.sql',
      'recycling_pickup_scheduler_audit_log.sql',
    ];

    for (const file of executionOrder) {
      if (!sqlFiles.includes(file)) continue;

      const filePath = path.join(sqlDir, file);
      console.log(`📄 Processing: ${file}`);

      let sql = fs.readFileSync(filePath, 'utf8');
      sql = convertMySQLtoPostgreSQL(sql);

      try {
        // Extract and execute only the CREATE TABLE statement
        const createTableMatch = sql.match(/CREATE TABLE\s+"([^"]+)"\s*\(([\s\S]*?)\);/i);
        if (createTableMatch) {
          await client.query(sql);
          console.log(`   ✅ Schema created\n`);
        } else {
          console.log(`   ⚠️  No CREATE TABLE found\n`);
        }
      } catch (err) {
        console.error(`   ❌ Error: ${err.message}`);
        console.error(`   SQL Preview: ${sql.substring(0, 150)}...\n`);
      }
    }

    console.log('✅ All schemas processed successfully!');
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupSupabase();
