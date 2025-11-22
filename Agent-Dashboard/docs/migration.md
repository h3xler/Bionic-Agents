# PostgreSQL Migration Guide

## Summary

The LiveKit Dashboard has been successfully converted from MySQL to PostgreSQL.

## Changes Made

### 1. Database Schema (`drizzle/`)

- ✅ Converted all tables from `mysqlTable` to `pgTable`
- ✅ Changed `int().autoincrement()` to `serial()` for primary keys
- ✅ Changed `mysqlEnum` to `pgEnum` for enum types
- ✅ Updated `onUpdateNow()` to standard timestamp (PostgreSQL handles updates via triggers if needed)
- ✅ Files updated:
  - `drizzle/schema.ts` - Users table
  - `drizzle/livekitSchema.ts` - All LiveKit tables

### 2. Database Configuration

- ✅ Updated `drizzle.config.ts` - Changed dialect from `"mysql"` to `"postgresql"`
- ✅ Updated `server/db.ts`:
  - Changed from `drizzle-orm/mysql2` to `drizzle-orm/node-postgres`
  - Changed from `drizzle(connectionString)` to `drizzle(pg.Pool)`
  - Updated `onDuplicateKeyUpdate` to `onConflictDoUpdate` (PostgreSQL syntax)

### 3. Dependencies (`package.json`)

- ✅ Removed: `mysql2: ^3.15.0`
- ✅ Added: `pg: ^8.13.1`
- ✅ Added: `@types/pg: ^8.11.10` (dev dependency)

### 4. SQL Query Conversions (`server/livekitRouter.ts`)

- ✅ `TIMESTAMPDIFF(SECOND, a, b)` → `EXTRACT(EPOCH FROM (b - a))::integer`
- ✅ `is_active = 1` → `is_active = true` (PostgreSQL boolean comparison)
- ✅ `NOW()` - Works in both, kept as-is
- ✅ `DATE()` - Works in both, kept as-is

### 5. Webhook Handler

- ✅ No changes needed - Uses Drizzle ORM which abstracts database differences

## Database Connection String Format

PostgreSQL connection string format:
```
postgresql://username:password@host:port/database
```

Example:
```
postgresql://postgres:password@localhost:5432/livekit_dashboard
```

## Migration Steps

1. **Install Dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up PostgreSQL Database:**
   ```bash
   # Create database
   createdb livekit_dashboard
   
   # Or using psql
   psql -U postgres -c "CREATE DATABASE livekit_dashboard;"
   ```

3. **Set Environment Variable:**
   ```bash
   export DATABASE_URL="postgresql://postgres:password@localhost:5432/livekit_dashboard"
   ```

4. **Run Migrations:**
   ```bash
   pnpm db:push
   ```

5. **Start the Application:**
   ```bash
   pnpm dev
   ```

## Migration Notes

- All existing functionality should work the same
- Enum types are now PostgreSQL enums (more type-safe)
- Serial columns replace AUTO_INCREMENT (PostgreSQL native)
- Boolean comparisons now use `true/false` instead of `1/0`
- Duration calculations use PostgreSQL's `EXTRACT(EPOCH FROM ...)` function

## Testing Checklist

- [x] Database connection successful
- [x] Migrations run without errors
- [x] Webhook handler stores events correctly
- [x] All dashboard pages load data correctly
- [x] Cost calculations work
- [x] Date filtering works
- [x] Session/Agent detail pages work

## Rollback

If you need to rollback to MySQL:
1. Revert all schema files
2. Change `drizzle.config.ts` back to `"mysql"`
3. Update `server/db.ts` to use `drizzle-orm/mysql2`
4. Revert SQL queries to MySQL syntax
5. Reinstall `mysql2` package

---
**Migration Date**: 2024  
**Status**: ✅ Complete

