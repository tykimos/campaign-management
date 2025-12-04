#!/bin/bash

# Database connection details
DB_HOST="db.zaivjzyuxyajadfwfbkx.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"
DB_PASS="sb_secret_dCVqXqJdhqBENbi0emxrYw_kuSuoNWx"

# Export password for non-interactive authentication
export PGPASSWORD="$DB_PASS"

# Execute SQL file
psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -f channel-tables.sql

echo "SQL execution completed!"