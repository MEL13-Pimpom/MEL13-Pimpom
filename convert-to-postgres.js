const fs = require('fs');
const path = require('path');

function convertMySQLtoPostgreSQL(sql) {
  let converted = sql;

  // Remove MySQL-specific pragmas and comments
  converted = converted.replace(/\/\*![0-9]+.*?\*\//g, '');
  converted = converted.replace(/^--.*?(?:Host|Database|Server version).*$/gm, '');
  converted = converted.replace(/^-- .*$/gm, (match) => {
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

  // Convert KEY definitions to PostgreSQL style
  // UNIQUE KEY becomes UNIQUE
  converted = converted.replace(/UNIQUE\s+KEY\s+"([^"]+)"\s*\(\s*"([^"]+)"\s*\)/gi, 'UNIQUE ("$2")');
  // PRIMARY KEY stays as is, just fix the quotes
  converted = converted.replace(/PRIMARY\s+KEY\s+\(\s*"([^"]+)"\s*\)/gi, 'PRIMARY KEY ("$1")');
  // Regular KEY becomes INDEX (but remove from constraint clauses)
  converted = converted.replace(/,\s+KEY\s+"([^"]+)"\s+\(\s*"([^"]+)"\s*\)/gi, ',\n  INDEX on_$1 ("$2")');
  // Fix FOREIGN KEY declarations
  converted = converted.replace(/CONSTRAINT\s+"([^"]+)"\s+FOREIGN\s+KEY\s+\(\s*"([^"]+)"\s*\)/gi, 'CONSTRAINT "$1" FOREIGN KEY ("$2")');

  // Clean up multiple spaces and newlines
  converted = converted.replace(/\n\s*\n/g, '\n');
  converted = converted.replace(/;[\s;]*;/g, ';');

  return converted.trim();
}

const sqlDir = path.join(__dirname, 'database', 'MySQL Recycling Pickup');
const outputDir = path.join(__dirname, 'database', 'PostgreSQL');

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const sqlFiles = fs.readdirSync(sqlDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`Converting ${sqlFiles.length} MySQL files to PostgreSQL...\n`);

sqlFiles.forEach(file => {
  const filePath = path.join(sqlDir, file);
  const outputPath = path.join(outputDir, file.replace('recycling_pickup_scheduler_', 'pg_'));

  let sql = fs.readFileSync(filePath, 'utf8');
  sql = convertMySQLtoPostgreSQL(sql);

  fs.writeFileSync(outputPath, sql, 'utf8');
  console.log(`✅ ${file} → ${path.basename(outputPath)}`);
});

// Generate combined migration file
const combinedPath = path.join(outputDir, '001_create_all_tables.sql');
const combinedSQL = sqlFiles.map(file => {
  const filePath = path.join(sqlDir, file);
  let sql = fs.readFileSync(filePath, 'utf8');
  sql = convertMySQLtoPostgreSQL(sql);
  return `-- ${file}\n${sql}`;
}).join('\n\n');

fs.writeFileSync(combinedPath, combinedSQL, 'utf8');
console.log(`\n✅ Combined migration: ${path.basename(combinedPath)}`);
console.log(`\n📁 All files saved to: database/PostgreSQL/`);
