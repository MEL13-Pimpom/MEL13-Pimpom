# Supabase Setup Guide

This directory contains PostgreSQL SQL files converted from your MySQL database schema for the Recycling Pickup Scheduler application.

## Files Generated

- **`database/PostgreSQL/`** - Converted PostgreSQL SQL files
  - Individual files: `pg_*.sql` - Each table schema
  - Combined file: `001_create_all_tables.sql` - All tables in one file

## Setup Methods

### Method 1: Using the Node.js Script (Recommended)

**Prerequisites:**
- Node.js installed
- Database URL from Supabase

**Steps:**

1. Set up environment variable with your Supabase connection string:

```bash
# On Windows (PowerShell):
$env:DATABASE_URL="postgresql://postgres:PASSWORD@HOST:5432/postgres"

# On Windows (CMD):
set DATABASE_URL=postgresql://postgres:PASSWORD@HOST:5432/postgres

# On macOS/Linux:
export DATABASE_URL="postgresql://postgres:PASSWORD@HOST:5432/postgres"
```

Replace:
- `PASSWORD` - Your Supabase database password
- `HOST` - Your Supabase host (e.g., `db.yjobjfaayfdrsghreoue.supabase.co`)

2. Run the setup script:

```bash
node setup-supabase.js
```

### Method 2: Using Supabase Dashboard SQL Editor

1. Go to your Supabase project dashboard
2. Open the SQL Editor
3. Copy and paste the entire contents of `database/PostgreSQL/001_create_all_tables.sql`
4. Click "Run" to execute all schemas at once

### Method 3: Using psql CLI

1. Connect to your Supabase database:

```bash
psql postgresql://postgres:PASSWORD@HOST:5432/postgres
```

2. Execute the SQL file:

```sql
\i database/PostgreSQL/001_create_all_tables.sql
```

Or import from command line:

```bash
psql postgresql://postgres:PASSWORD@HOST:5432/postgres < database/PostgreSQL/001_create_all_tables.sql
```

## Schema Overview

The following tables are created:

1. **account** - User accounts (users, admins, collectors)
2. **address** - User addresses
3. **pickup_time_slot** - Available time slots for pickups
4. **waste_category** - Categories of waste materials
5. **pickup_request** - Recycling pickup requests
6. **request_item** - Items included in each request
7. **request_image** - Images attached to requests
8. **notification** - Notifications for users
9. **audit_log** - Audit trail of changes

## Conversion Notes

- MySQL AUTO_INCREMENT → PostgreSQL SERIAL
- MySQL ENUM → PostgreSQL VARCHAR(100)
- MySQL TINYINT(1) → PostgreSQL BOOLEAN
- MySQL datetime → PostgreSQL TIMESTAMP
- MySQL backticks → PostgreSQL double quotes

## Troubleshooting

**Connection Error: "ENOTFOUND"**
- Verify your DATABASE_URL is correct
- Check internet connectivity
- Ensure your Supabase project is accessible

**FK Constraint Errors**
- Execute tables in dependency order (setup-supabase.js does this automatically)
- Ensure all referenced tables are created first

**Permission Errors**
- Verify your Supabase database user has CREATE TABLE permissions
- Use the postgres superuser role if needed

## Next Steps

After schemas are created:

1. Insert initial data into `waste_category` table
2. Set up Row Level Security (RLS) policies in Supabase
3. Create API endpoints for your application
4. Test the schema with sample data

For more info, visit: https://supabase.com/docs
