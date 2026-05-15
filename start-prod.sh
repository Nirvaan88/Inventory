#!/bin/bash
export DB_MODE=sql
export DB_HOST=localhost
export DB_USER=sa
export DB_PASS=Admin@123
export DB_NAME=Inventorybkp
export DB_PORT=1433
export NODE_ENV=production
export SESSION_SECRET=kisna-inventory-super-secret-2024
 
echo "Starting Kisna Inventory in PRODUCTION mode..."
echo "  DB Host : $DB_HOST"
echo "  DB Name : $DB_NAME"
echo ""
node server.js
