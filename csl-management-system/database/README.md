# Database Documentation

## Overview
This directory contains all database-related files for the CSL Management System.

## Structure

```
database/
├── migrations/          # Database migration files
├── seeds/              # Seed data for development/testing
├── schemas/            # SQL schema definitions
├── diagrams/           # ER diagrams and flow charts
├── init/               # Initial database setup scripts
└── scripts/            # Utility scripts for database management
```

## Database Design Principles

1. **Normalization**: Follow 3NF (Third Normal Form)
2. **Indexing**: Strategic indexes for performance
3. **Constraints**: Foreign keys, unique constraints, checks
4. **Audit Trail**: Created/updated timestamps on all tables
5. **Soft Deletes**: Use deleted_at for data retention

## Naming Conventions

- Tables: `snake_case` (plural) - e.g., `users`, `products`
- Columns: `snake_case` - e.g., `first_name`, `created_at`
- Primary Keys: `id` (UUID or BIGSERIAL)
- Foreign Keys: `{table}_id` - e.g., `user_id`
- Indexes: `idx_{table}_{column(s)}`
- Constraints: `{table}_{column}_{type}` - e.g., `users_email_unique`

## Running Migrations

### Development
```bash
npm run migrate:dev
```

### Production
```bash
npm run migrate:prod
```

## Creating New Migrations

```bash
npm run migrate:create <descriptive-name>
```

## Seeding Data

```bash
npm run seed
```

## Backup & Restore

### Backup
```bash
npm run db:backup
```

### Restore
```bash
npm run db:restore <backup-file>
```
