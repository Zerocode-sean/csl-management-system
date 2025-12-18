#!/bin/bash

# =====================================================
# Database initialization script for Docker container
# This script runs when PostgreSQL container starts🐧👨‍💻🐧
# =====================================================

set -e

echo "========================================="
echo "CSL Management System - Database Setup"
echo "========================================="

# Function to wait for PostgreSQL to be ready
wait_for_postgres() {
    echo "Waiting for PostgreSQL to be ready..."
    until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" > /dev/null 2>&1; do
        sleep 1
    done
    echo "PostgreSQL is ready!"
}

# Wait for PostgreSQL
wait_for_postgres

# Run the database initialization
echo "Creating extensions..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create required extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    
    -- Log initialization
    SELECT 'Database extensions created successfully at ' || NOW() as message;
EOSQL

# Apply complete schema
echo "Applying database schema..."
if [ -f /schemas/complete_schema.sql ]; then
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /schemas/complete_schema.sql
    echo "Database schema applied successfully!"
else
    echo "WARNING: Schema file not found at /schemas/complete_schema.sql"
fi

echo "========================================="
echo "Database initialization completed!"
echo "========================================="
