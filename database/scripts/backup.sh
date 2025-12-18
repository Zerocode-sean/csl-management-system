#!/bin/bash

# =====================================================
# Database Backup Script
# Creates compressed backup of PostgreSQL database
# =====================================================

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_NAME="${DB_NAME:-csl_database}"
DB_USER="${DB_USER:-csl_user}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/csl_backup_$TIMESTAMP.sql"
RETENTION_DAYS=${RETENTION_DAYS:-30}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "========================================="
echo "CSL Database Backup"
echo "========================================="
echo "Database: $DB_NAME"
echo "Timestamp: $TIMESTAMP"
echo "========================================="

# Perform backup
echo "Creating backup..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --clean --if-exists --create \
    -F p -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✓ Backup created successfully"
    
    # Compress backup
    echo "Compressing backup..."
    gzip "$BACKUP_FILE"
    BACKUP_FILE="$BACKUP_FILE.gz"
    
    # Get file size
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✓ Backup compressed: $BACKUP_FILE ($SIZE)"
    
    # Clean old backups
    echo "Cleaning backups older than $RETENTION_DAYS days..."
    find "$BACKUP_DIR" -name "csl_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    echo "✓ Old backups cleaned"
    
    echo "========================================="
    echo "Backup completed successfully!"
    echo "File: $BACKUP_FILE"
    echo "========================================="
else
    echo "✗ Backup failed!"
    exit 1
fi
