# Database Scripts

This directory contains utility scripts for database management.

## Available Scripts

### backup.sh
Creates a PostgreSQL backup with timestamp and compression.

```bash
./scripts/backup.sh
```

### restore.sh
Restores database from a backup file.

```bash
./scripts/restore.sh <backup-file>
```

### reset-dev.sh
**DANGER**: Drops and recreates the database (development only).

```bash
./scripts/reset-dev.sh
```

### migrate.sh
Runs database migrations.

```bash
./scripts/migrate.sh
```

## Usage in Docker

```bash
# Backup
docker-compose exec postgres /app/database/scripts/backup.sh

# Restore
docker-compose exec postgres /app/database/scripts/restore.sh backup_file.sql.gz
```
