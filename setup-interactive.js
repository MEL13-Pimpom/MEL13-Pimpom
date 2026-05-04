#!/usr/bin/env node

const readline = require('readline');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

async function main() {
  console.log('\n🌱 Supabase Recycling Scheduler Setup\n');
  console.log('This wizard will help you set up your PostgreSQL schemas on Supabase.\n');

  // Get connection details
  const host = await question('📍 Supabase Host (e.g., db.xxxxx.supabase.co): ');
  const port = await question('🔌 Port (default 5432): ') || '5432';
  const user = await question('👤 Database User (default postgres): ') || 'postgres';
  const password = await question('🔐 Password: ');
  const database = await question('💾 Database Name (default postgres): ') || 'postgres';

  const DATABASE_URL = `postgresql://${user}:${password}@${host}:${port}/${database}`;

  console.log('\n🔍 Testing connection...');

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connection successful!\n');

    // Ask what to do
    const choice = await question('What would you like to do?\n1. Create all tables\n2. View SQL files\n3. Exit\n\nChoice (1-3): ');

    if (choice === '1') {
      console.log('\n⏳ Creating tables...\n');

      const sqlDir = path.join(__dirname, 'database', 'MySQL Recycling Pickup');
      const sqlFiles = fs.readdirSync(sqlDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

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
        let sql = fs.readFileSync(filePath, 'utf8');

        // Use the same conversion as in convert-to-postgres.js
        sql = sql.replace(/\/\*![0-9]+.*?\*\//g, '')
          .replace(/`([^`]+)`/g, '"$1"')
          .replace(/enum\('([^']+(?:','[^']+)*?)'\)/gi, 'VARCHAR(100)')
          .replace(/tinyint\(1\)/gi, 'BOOLEAN')
          .replace(/\bdatetime\b/gi, 'TIMESTAMP')
          .replace(/int\(11\)\s+NOT NULL\s+AUTO_INCREMENT/gi, 'SERIAL')
          .replace(/int\(11\)/gi, 'INTEGER')
          .replace(/\s+ENGINE=[^\s;]+/gi, '')
          .replace(/\s+DEFAULT CHARSET=[^\s;]+/gi, '')
          .replace(/\s+COLLATE=[^\s;]+/gi, '')
          .replace(/\s+DEFAULT NULL/gi, '')
          .replace(/UNIQUE\s+KEY\s+"([^"]+)"\s*\(\s*"([^"]+)"\s*\)/gi, 'UNIQUE ("$2")')
          .replace(/PRIMARY\s+KEY\s+\(\s*"([^"]+)"\s*\)/gi, 'PRIMARY KEY ("$1")')
          .replace(/,\s+KEY\s+"([^"]+)"\s+\(\s*"([^"]+)"\s*\)/gi, ',\n  INDEX on_$1 ("$2")')
          .replace(/CONSTRAINT\s+"([^"]+)"\s+FOREIGN\s+KEY\s+\(\s*"([^"]+)"\s*\)/gi, 'CONSTRAINT "$1" FOREIGN KEY ("$2")')
          .replace(/\n\s*\n/g, '\n')
          .replace(/;[\s;]*;/g, ';')
          .trim();

        try {
          await client.query(sql);
          console.log(`✅ ${file.replace('recycling_pickup_scheduler_', '')}`);
        } catch (err) {
          console.error(`❌ ${file}: ${err.message}`);
        }
      }

      console.log('\n✅ Setup complete!\n');
    } else if (choice === '2') {
      console.log('\n📂 PostgreSQL files are located in: database/PostgreSQL/');
      console.log('   - Individual files: pg_*.sql');
      console.log('   - Combined file: 001_create_all_tables.sql\n');
    }
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  } finally {
    await client.end();
    rl.close();
  }
}

main();
