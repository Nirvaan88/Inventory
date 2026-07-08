#!/bin/bash
# start-prod.sh — Run this on your AWS server to start the app
# Usage: bash start-prod.sh

export DB_MODE=sql
export DB_HOST=localhost          # SQL Server is on same machine
export DB_USER=sa
export DB_PASS=Admin@123
export DB_NAME=Inventorybkp
export DB_PORT=1433
export NODE_ENV=production
export SESSION_SECRET=kisna-inventory-super-secret-2024

echo "Starting Kisna Inventory in PRODUCTION mode..."
echo "  DB Host : $DB_HOST"
echo "  DB Name : $DB_NAME"
echo "  DB User : $DB_USER"
echo ""

node server.js
